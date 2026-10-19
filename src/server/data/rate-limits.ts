import "server-only";
import { MongoServerError, type Db } from "mongodb";
import type { RateLimit } from "./schemas/system";

// Fixed-window counters (PRD §13.5). System-level, no AuthContext: called only by
// src/server/rate-limit.ts. `key` is already a keyed hash, never a raw IP or email.

/** Increments the counter for (key, windowStart) and returns the new count. */
export async function incrementRateLimit(
  db: Db,
  key: string,
  windowStart: Date,
  expiresAt: Date,
  now = new Date(),
): Promise<number> {
  const col = db.collection<RateLimit>("rate_limits");
  const run = () =>
    col.findOneAndUpdate(
      { key, windowStart },
      { $inc: { count: 1 }, $set: { updatedAt: now }, $setOnInsert: { expiresAt, createdAt: now } },
      { upsert: true, returnDocument: "after" },
    );
  let doc;
  try {
    doc = await run();
  } catch (err) {
    // Two concurrent upserts for a new window: one loses on the unique index; retry updates.
    if (!(err instanceof MongoServerError && err.code === 11000)) throw err;
    doc = await run();
  }
  return doc?.count ?? 1;
}
