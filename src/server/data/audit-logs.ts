import "server-only";
import type { Db, ObjectId } from "mongodb";
import { auditLogSchema, type AuditLog } from "./schemas/system";

// Write path for audit_logs. Append-only: no update or delete exports.
// Reads (audit viewer, PRD §12.3) come with that task and require `audit:read`.
// Callers go through src/server/audit.ts, which allowlists `meta`.

export async function insertAuditLog(db: Db, entry: Omit<AuditLog, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
  const now = new Date();
  const doc = auditLogSchema.parse({ ...entry, createdAt: now, updatedAt: now });
  const result = await db.collection<AuditLog>("audit_logs").insertOne(doc);
  return result.insertedId;
}
