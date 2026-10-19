import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ensureCollections } from "@/server/data/registry";
import {
  checkRateLimit,
  FORM_TOKEN_FIELD,
  guardPublicForm,
  HONEYPOT_FIELD,
  MAX_FORM_AGE_MS,
  MIN_FILL_MS,
  publicFormToken,
  rateLimitKey,
} from "@/server/rate-limit";
import { startMongo, type TestMongo } from "./helpers/mongo";

const secret = "s".repeat(32);
const rule = { limit: 3, windowMs: 60_000 };
const t0 = new Date("2026-10-19T12:00:00.000Z");
const at = (ms: number) => new Date(t0.getTime() + ms);

describe("rate limit (fixed window)", () => {
  let mongo: TestMongo;

  beforeAll(async () => {
    mongo = await startMongo();
    await ensureCollections(mongo.db);
  });
  afterAll(async () => mongo.stop());
  beforeEach(async () => {
    await mongo.db.collection("rate_limits").deleteMany({});
  });

  const hit = (id: string, now: Date) => checkRateLimit("test", id, rule, { db: mongo.db, now, secret });

  it("allows up to the limit, then blocks", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hit("203.0.113.5", at(i * 1000)));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[0].resetAt).toEqual(at(60_000));
  });

  it("resets in the next window and keeps identifiers separate", async () => {
    for (let i = 0; i < 4; i++) await hit("203.0.113.5", at(i));
    expect((await hit("203.0.113.5", at(59_999))).allowed).toBe(false);
    expect((await hit("198.51.100.7", at(59_999))).allowed).toBe(true);
    expect((await hit("203.0.113.5", at(60_000))).allowed).toBe(true);
  });

  it("stores only a keyed hash with a TTL expiry, and handles concurrent first hits", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => hit("Member@Example.org", t0)));
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    const docs = await mongo.db.collection("rate_limits").find({}).toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0].count).toBe(5);
    expect(docs[0].expiresAt).toEqual(at(60_000));
    expect(JSON.stringify(docs[0])).not.toMatch(/example/i);
    expect(docs[0].key).toBe(rateLimitKey("test", "member@example.org", secret));
  });
});

describe("guardPublicForm", () => {
  const form = (fields: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  };
  const token = publicFormToken({ now: t0, secret });
  const valid = { [FORM_TOKEN_FIELD]: token, [HONEYPOT_FIELD]: "", message: "hello" };

  it("accepts a normal submission", () => {
    expect(guardPublicForm(form(valid), { now: at(MIN_FILL_MS), secret })).toEqual({ ok: true });
  });

  it("rejects a filled honeypot", () => {
    const res = guardPublicForm(form({ ...valid, [HONEYPOT_FIELD]: "http://spam.example" }), { now: at(10_000), secret });
    expect(res).toEqual({ ok: false, reason: "honeypot" });
  });

  it("rejects too-fast, expired, missing and forged tokens", () => {
    expect(guardPublicForm(form(valid), { now: at(MIN_FILL_MS - 1), secret })).toEqual({ ok: false, reason: "too_fast" });
    expect(guardPublicForm(form(valid), { now: at(MAX_FORM_AGE_MS + 1), secret })).toEqual({ ok: false, reason: "expired" });
    expect(guardPublicForm(form({ message: "x" }), { now: at(10_000), secret })).toEqual({ ok: false, reason: "bad_token" });
    // Backdated timestamp with the old signature, and a token signed by another secret.
    const forged = `${t0.getTime() - 60_000}.${token.split(".")[1]}`;
    expect(guardPublicForm(form({ ...valid, [FORM_TOKEN_FIELD]: forged }), { now: at(1), secret }).ok).toBe(false);
    const other = publicFormToken({ now: t0, secret: "o".repeat(32) });
    expect(guardPublicForm(form({ ...valid, [FORM_TOKEN_FIELD]: other }), { now: at(10_000), secret }).ok).toBe(false);
  });

  it("checks Origin when headers are passed", () => {
    const opts = { now: at(10_000), secret, allowedOrigins: ["https://care.example.org"] };
    const ok = new Headers({ origin: "https://care.example.org" });
    expect(guardPublicForm(form(valid), { ...opts, headers: ok })).toEqual({ ok: true });
    const bad = new Headers({ origin: "https://evil.example" });
    expect(guardPublicForm(form(valid), { ...opts, headers: bad })).toEqual({ ok: false, reason: "bad_origin" });
    expect(guardPublicForm(form(valid), { ...opts, headers: new Headers() })).toEqual({ ok: false, reason: "bad_origin" });
  });
});
