import { ObjectId, type Document } from "mongodb";
import { z } from "zod";

// PRD §3.1: each collection has a zod schema (app-side) and a matching
// `$jsonSchema` validator (DB-side, applied by scripts/db-ensure.ts).
// Keep the two in step when editing either.
// Relative imports only: this file is loaded by Node type stripping in scripts/.

const timestamps = { createdAt: z.date(), updatedAt: z.date() };
const timestampProps = { createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" } };

// --- organization_settings (singleton, PRD §1.2) ---------------------------

export const organizationSettingsSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  key: z.literal("default"),
  name: z.string().min(1).max(200),
  tagline: z.string().max(300).optional(),
  logoFileId: z.instanceof(ObjectId).optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  businessHours: z.string().max(500).optional(),
  timezone: z.string().min(1).default("America/New_York"),
  currency: z.string().length(3).default("USD"),
  legalEntityName: z.string().max(200).optional(),
  ...timestamps,
});
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

export const organizationSettingsValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["key", "name", "timezone", "currency", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      key: { enum: ["default"] },
      name: { bsonType: "string", minLength: 1, maxLength: 200 },
      tagline: { bsonType: "string", maxLength: 300 },
      logoFileId: { bsonType: "objectId" },
      contactEmail: { bsonType: "string", maxLength: 320 },
      contactPhone: { bsonType: "string", maxLength: 40 },
      address: { bsonType: "string", maxLength: 500 },
      businessHours: { bsonType: "string", maxLength: 500 },
      timezone: { bsonType: "string", minLength: 1 },
      currency: { bsonType: "string", minLength: 3, maxLength: 3 },
      legalEntityName: { bsonType: "string", maxLength: 200 },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};

// --- audit_logs (PRD §13.6) ------------------------------------------------
// `meta` holds allowlisted, non-sensitive fields only (enforced by src/server/audit.ts).

export const auditLogSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  actorId: z.instanceof(ObjectId).nullable(),
  action: z.string().min(1).max(100),
  targetType: z.string().max(100).optional(),
  targetId: z.instanceof(ObjectId).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  ...timestamps,
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["actorId", "action", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      actorId: { bsonType: ["objectId", "null"] },
      action: { bsonType: "string", minLength: 1, maxLength: 100 },
      targetType: { bsonType: "string", maxLength: 100 },
      targetId: { bsonType: "objectId" },
      meta: { bsonType: "object" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};

// --- rate_limits (PRD §13.5, fixed window, TTL on expiresAt) ----------------
// `key` is a hash of scope + identifier, never a raw IP or email.

export const rateLimitSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  key: z.string().min(1).max(200),
  windowStart: z.date(),
  count: z.number().int().min(0),
  expiresAt: z.date(),
  ...timestamps,
});
export type RateLimit = z.infer<typeof rateLimitSchema>;

export const rateLimitValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["key", "windowStart", "count", "expiresAt", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      key: { bsonType: "string", minLength: 1, maxLength: 200 },
      windowStart: { bsonType: "date" },
      count: { bsonType: ["int", "long"], minimum: 0 },
      expiresAt: { bsonType: "date" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};

// --- email_outbox (PRD §14, dev transport only) ------------------------------
// Written only when Resend is not configured outside production. Bodies may hold
// sign-in links, so docs expire via TTL and are viewable only at /dev/outbox.

export const EMAIL_TEMPLATES = [
  "verification",
  "magic_link",
  "inquiry_received",
  "consultation_booked",
  "reminder",
  "cancellation",
  "enrollment_confirmed",
  "lesson_released",
  "receipt",
  "payment_failed",
  "quote_ready",
  "wedding_confirmed",
  "funeral_confirmed",
  "event_registration",
  "renewal_notice",
  "scholarship_decision",
  "follow_up_invitation",
] as const;
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

export const OUTBOX_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const emailOutboxSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  to: z.email().max(320),
  subject: z.string().min(1).max(200),
  text: z.string().min(1).max(20_000),
  html: z.string().max(200_000).optional(),
  template: z.enum(EMAIL_TEMPLATES),
  expiresAt: z.date(),
  ...timestamps,
});
export type EmailOutboxEntry = z.infer<typeof emailOutboxSchema>;

export const emailOutboxValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["to", "subject", "text", "template", "expiresAt", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      to: { bsonType: "string", minLength: 3, maxLength: 320 },
      subject: { bsonType: "string", minLength: 1, maxLength: 200 },
      text: { bsonType: "string", minLength: 1, maxLength: 20000 },
      html: { bsonType: "string", maxLength: 200000 },
      template: { enum: [...EMAIL_TEMPLATES] },
      expiresAt: { bsonType: "date" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};
