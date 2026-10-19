import "server-only";
import type { Db, ObjectId } from "mongodb";
import { emailOutboxSchema, OUTBOX_TTL_MS, type EmailOutboxEntry } from "./schemas/system";

// Dev email transport store (PRD §14). System-level, no AuthContext: written only
// by src/server/email when Resend is absent outside production, read only by the
// dev-only /dev/outbox page. Never call from production code paths.

export async function insertOutboxEmail(
  db: Db,
  entry: Omit<EmailOutboxEntry, "_id" | "expiresAt" | "createdAt" | "updatedAt">,
  now = new Date(),
): Promise<ObjectId> {
  const doc = emailOutboxSchema.parse({
    ...entry,
    expiresAt: new Date(now.getTime() + OUTBOX_TTL_MS),
    createdAt: now,
    updatedAt: now,
  });
  const result = await db.collection<EmailOutboxEntry>("email_outbox").insertOne(doc);
  return result.insertedId;
}

/** Newest first. */
export async function listOutboxEmails(db: Db, limit = 50): Promise<EmailOutboxEntry[]> {
  return db
    .collection<EmailOutboxEntry>("email_outbox")
    .find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 200))
    .toArray();
}
