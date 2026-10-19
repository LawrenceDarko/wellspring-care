import type { Db, Document, IndexDescription } from "mongodb";
import {
  auditLogValidator,
  organizationSettingsValidator,
  rateLimitValidator,
} from "./schemas/system.ts";

// PRD §3.1: single source of collection validators + indexes, applied by
// `npm run db:ensure` and by test helpers. Every index has an explicit name so
// re-running is a no-op. Relative imports only (loaded by Node in scripts/).

export type CollectionSpec = {
  name: string;
  validator: Document;
  indexes: IndexDescription[];
};

export const collections: CollectionSpec[] = [
  {
    name: "organization_settings",
    validator: organizationSettingsValidator,
    indexes: [{ key: { key: 1 }, name: "key_unique", unique: true }],
  },
  {
    name: "audit_logs",
    validator: auditLogValidator,
    indexes: [
      { key: { createdAt: -1 }, name: "createdAt_desc" },
      { key: { actorId: 1, createdAt: -1 }, name: "actor_createdAt" },
      { key: { targetType: 1, targetId: 1, createdAt: -1 }, name: "target_createdAt" },
    ],
  },
  {
    name: "rate_limits",
    validator: rateLimitValidator,
    indexes: [
      { key: { key: 1, windowStart: 1 }, name: "key_window_unique", unique: true },
      { key: { expiresAt: 1 }, name: "expiresAt_ttl", expireAfterSeconds: 0 },
    ],
  },
];

/** Creates or updates each collection's validator, then its indexes. Idempotent. */
export async function ensureCollections(db: Db, specs: CollectionSpec[] = collections): Promise<void> {
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name),
  );
  for (const spec of specs) {
    const validation = { validator: spec.validator, validationLevel: "strict", validationAction: "error" } as const;
    if (existing.has(spec.name)) {
      await db.command({ collMod: spec.name, ...validation });
    } else {
      await db.createCollection(spec.name, validation);
    }
    if (spec.indexes.length > 0) {
      await db.collection(spec.name).createIndexes(spec.indexes);
    }
  }
}
