import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Db } from "mongodb";
import { getConfig } from "./config";
import { getDb } from "./db";
import { incrementRateLimit } from "./data/rate-limits";

// PRD §13.5 abuse controls: Mongo fixed-window rate limits + public-form guard
// (honeypot, signed render timestamp for min fill time, Origin check).

export type RateLimitRule = { limit: number; windowMs: number };

export const RATE_LIMITS = {
  signInEmail: { limit: 5, windowMs: 15 * 60_000 },
  signInIp: { limit: 20, windowMs: 15 * 60_000 },
  publicForm: { limit: 10, windowMs: 60 * 60_000 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

type Deps = { db?: Db; now?: Date; secret?: string };

const secretOf = (deps?: Deps) => deps?.secret ?? getConfig().env.AUTH_SECRET;

/** Keyed hash of scope + identifier, so stored keys never reveal an IP or email. */
export function rateLimitKey(scope: string, identifier: string, secret: string): string {
  const id = identifier.trim().toLowerCase();
  return `${scope}:${createHmac("sha256", secret).update(`${scope}\0${id}`).digest("base64url")}`;
}

/** Counts one attempt and reports whether it is within the limit. Increment-then-check. */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  rule: RateLimitRule,
  deps: Deps = {},
): Promise<RateLimitResult> {
  const now = deps.now ?? new Date();
  const start = Math.floor(now.getTime() / rule.windowMs) * rule.windowMs;
  const resetAt = new Date(start + rule.windowMs);
  const db = deps.db ?? (await getDb());
  const count = await incrementRateLimit(db, rateLimitKey(scope, identifier, secretOf(deps)), new Date(start), resetAt, now);
  return { allowed: count <= rule.limit, remaining: Math.max(rule.limit - count, 0), resetAt };
}

export function rateLimit(scope: RateLimitScope, identifier: string, deps?: Deps): Promise<RateLimitResult> {
  return checkRateLimit(scope, identifier, RATE_LIMITS[scope], deps);
}

/** Best-effort client IP from proxy headers; "unknown" when absent (shares one bucket). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

// --- public-form guard ------------------------------------------------------

export const HONEYPOT_FIELD = "website";
export const FORM_TOKEN_FIELD = "formToken";
export const MIN_FILL_MS = 3_000;
export const MAX_FORM_AGE_MS = 24 * 60 * 60_000;

export type GuardFailure = "honeypot" | "bad_token" | "too_fast" | "expired" | "bad_origin";
export type GuardResult = { ok: true } | { ok: false; reason: GuardFailure };

const sign = (ts: string, secret: string) =>
  createHmac("sha256", secret).update(`public-form\0${ts}`).digest("base64url");

/** Render into the form as a hidden `formToken` input; proves when the form was served. */
export function publicFormToken(deps: Pick<Deps, "now" | "secret"> = {}): string {
  const ts = String((deps.now ?? new Date()).getTime());
  return `${ts}.${sign(ts, secretOf(deps))}`;
}

function tokenTime(token: unknown, secret: string): number | null {
  if (typeof token !== "string") return null;
  const [ts, mac, ...rest] = token.split(".");
  if (!ts || !mac || rest.length || !/^\d{1,15}$/.test(ts)) return null;
  const expected = Buffer.from(sign(ts, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Number(ts);
}

/**
 * Server actions already get Next's origin check; pass `headers` from route handlers
 * that mutate so `Origin` must match APP_URL (or `allowedOrigins`). A missing Origin fails.
 */
export function guardPublicForm(
  form: FormData,
  opts: { headers?: Headers; allowedOrigins?: string[]; now?: Date; secret?: string } = {},
): GuardResult {
  const honeypot = form.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" ? honeypot.trim() !== "" : honeypot !== null) {
    return { ok: false, reason: "honeypot" };
  }

  if (opts.headers) {
    const allowed = opts.allowedOrigins ?? [new URL(getConfig().env.APP_URL).origin];
    const origin = opts.headers.get("origin");
    if (!origin || !allowed.includes(origin)) return { ok: false, reason: "bad_origin" };
  }

  const issued = tokenTime(form.get(FORM_TOKEN_FIELD), secretOf(opts));
  if (issued === null) return { ok: false, reason: "bad_token" };
  const age = (opts.now ?? new Date()).getTime() - issued;
  if (age < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  if (age > MAX_FORM_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true };
}
