import "server-only";
import type { Db, ObjectId } from "mongodb";
import type { AuthContext } from "./auth/context";
import { insertAuditLog } from "./data/audit-logs";
import { getDb } from "./db";

// PRD §13.6: audit role changes, break-glass, note access, exports, deletions,
// refunds, settings changes. `meta` keeps allowlisted keys with primitive
// values only; never note text, reasons, names or contact details.

export const AUDIT_ACTIONS = [
  "role.grant",
  "role.revoke",
  "break_glass",
  "note.read",
  "export",
  "deletion",
  "refund",
  "settings.update",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_META_FIELDS = [
  "role",
  "capability",
  "collection",
  "field",
  "format",
  "count",
  "amountCents",
  "currency",
  "fromStatus",
  "toStatus",
  "kid",
] as const;
export type AuditMetaField = (typeof AUDIT_META_FIELDS)[number];
export type AuditMeta = Partial<Record<AuditMetaField, string | number | boolean>>;

const ALLOWED_META = new Set<string>(AUDIT_META_FIELDS);
const MAX_STRING = 100;

export function sanitizeAuditMeta(meta: Record<string, unknown> = {}): AuditMeta {
  const kept: AuditMeta = {};
  for (const [key, v] of Object.entries(meta)) {
    if (!ALLOWED_META.has(key)) continue;
    if (typeof v === "string") kept[key as AuditMetaField] = v.slice(0, MAX_STRING);
    else if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) kept[key as AuditMetaField] = v;
  }
  return kept;
}

export type AuditEvent = {
  action: AuditAction;
  targetType?: string;
  targetId?: ObjectId;
  meta?: Record<string, unknown>;
};

/** Appends an audit entry. `ctx` null = system actor (cron, webhook). */
export async function recordAudit(ctx: AuthContext | null, event: AuditEvent, db?: Db): Promise<ObjectId> {
  if (!AUDIT_ACTIONS.includes(event.action)) throw new Error("Unknown audit action");
  const meta = sanitizeAuditMeta(event.meta);
  return insertAuditLog(db ?? (await getDb()), {
    actorId: ctx?.userId ?? null,
    action: event.action,
    ...(event.targetType ? { targetType: event.targetType } : {}),
    ...(event.targetId ? { targetId: event.targetId } : {}),
    ...(Object.keys(meta).length ? { meta } : {}),
  });
}
