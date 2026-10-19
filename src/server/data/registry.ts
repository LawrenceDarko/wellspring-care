import type { Db, Document, IndexDescription } from "mongodb";
import {
  auditLogValidator,
  emailOutboxValidator,
  organizationSettingsValidator,
  rateLimitValidator,
} from "./schemas/system.ts";
import { userRoleValidator } from "./schemas/identity.ts";
import { serviceCategoryValidator, servicePackageValidator, serviceValidator } from "./schemas/catalog.ts";
import { eventValidator, testimonialValidator } from "./schemas/content.ts";

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
  {
    name: "email_outbox",
    validator: emailOutboxValidator,
    indexes: [
      { key: { createdAt: -1 }, name: "createdAt_desc" },
      { key: { expiresAt: 1 }, name: "expiresAt_ttl", expireAfterSeconds: 0 },
    ],
  },
  {
    name: "user_roles",
    validator: userRoleValidator,
    indexes: [{ key: { userId: 1, role: 1 }, name: "user_role_unique", unique: true }],
  },
  {
    name: "service_categories",
    validator: serviceCategoryValidator,
    indexes: [
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { active: 1, order: 1 }, name: "active_order" },
    ],
  },
  {
    name: "services",
    validator: serviceValidator,
    indexes: [
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { categoryId: 1, active: 1, order: 1 }, name: "category_active_order" },
    ],
  },
  {
    name: "service_packages",
    validator: servicePackageValidator,
    indexes: [
      { key: { serviceId: 1, slug: 1 }, name: "service_slug_unique", unique: true },
      { key: { serviceId: 1, active: 1, order: 1 }, name: "service_active_order" },
    ],
  },
  {
    name: "events",
    validator: eventValidator,
    indexes: [
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { published: 1, startsAt: 1 }, name: "published_startsAt" },
    ],
  },
  {
    name: "testimonials",
    validator: testimonialValidator,
    indexes: [{ key: { published: 1, order: 1 }, name: "published_order" }],
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
