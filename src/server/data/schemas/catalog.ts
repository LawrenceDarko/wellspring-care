import { ObjectId, type Document } from "mongodb";
import { z } from "zod";

// PRD §3.2 catalog: service_categories, services, service_packages.
// Keep zod and `$jsonSchema` in step. Relative imports only (loaded by Node).
// Prices are integer cents in the org currency. Packages stay `active: false`
// until an admin reviews them (PRD §8).

const timestamps = { createdAt: z.date(), updatedAt: z.date() };
const timestampProps = { createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" } };
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const slugProps = { bsonType: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 80 };

export const CHANNELS = ["in_person", "video", "phone"] as const;
export type Channel = (typeof CHANNELS)[number];

// --- service_categories ----------------------------------------------------

export const serviceCategorySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  slug,
  name: z.string().min(1).max(120),
  summary: z.string().max(500),
  order: z.number().int().min(0),
  active: z.boolean(),
  ...timestamps,
});
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;

export const serviceCategoryValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "name", "summary", "order", "active", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      slug: slugProps,
      name: { bsonType: "string", minLength: 1, maxLength: 120 },
      summary: { bsonType: "string", maxLength: 500 },
      order: { bsonType: "int", minimum: 0 },
      active: { bsonType: "bool" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};

// --- services --------------------------------------------------------------
// `bodyRef` names long-form copy in src/content (PRD §4.2). `intakeFormKey`
// names an intake_forms key (PRD §5.1); forms arrive with the intake engine.

export const serviceSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  slug,
  categoryId: z.instanceof(ObjectId),
  name: z.string().min(1).max(120),
  summary: z.string().max(500),
  bodyRef: z.string().max(120).optional(),
  eligibility: z.string().max(500).optional(),
  intakeFormKey: z.string().min(1).max(80),
  order: z.number().int().min(0),
  active: z.boolean(),
  ...timestamps,
});
export type Service = z.infer<typeof serviceSchema>;

export const serviceValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "categoryId", "name", "summary", "intakeFormKey", "order", "active", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      slug: slugProps,
      categoryId: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: 120 },
      summary: { bsonType: "string", maxLength: 500 },
      bodyRef: { bsonType: "string", maxLength: 120 },
      eligibility: { bsonType: "string", maxLength: 500 },
      intakeFormKey: { bsonType: "string", minLength: 1, maxLength: 80 },
      order: { bsonType: "int", minimum: 0 },
      active: { bsonType: "bool" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};

// --- service_packages ------------------------------------------------------

export const depositRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("percent"), percent: z.number().int().min(1).max(100) }),
  z.object({ type: z.literal("fixed"), amountCents: z.number().int().min(1) }),
]);
export type DepositRule = z.infer<typeof depositRuleSchema>;

export const servicePackageSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  serviceId: z.instanceof(ObjectId),
  slug,
  name: z.string().min(1).max(120),
  sessionCount: z.number().int().min(1).max(52),
  minutesPerSession: z.number().int().min(15).max(240),
  durationWeeks: z.number().int().min(1).max(52),
  channels: z.array(z.enum(CHANNELS)).min(1),
  responseTimeText: z.string().max(120),
  includedItems: z.array(z.string().min(1).max(200)).max(20),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3),
  depositRule: depositRuleSchema,
  installmentsAllowed: z.boolean(),
  stripePriceId: z.string().max(255).optional(),
  order: z.number().int().min(0),
  active: z.boolean(),
  ...timestamps,
});
export type ServicePackage = z.infer<typeof servicePackageSchema>;

export const servicePackageValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "serviceId", "slug", "name", "sessionCount", "minutesPerSession", "durationWeeks", "channels",
      "responseTimeText", "includedItems", "priceCents", "currency", "depositRule", "installmentsAllowed",
      "order", "active", "createdAt", "updatedAt",
    ],
    properties: {
      _id: { bsonType: "objectId" },
      serviceId: { bsonType: "objectId" },
      slug: slugProps,
      name: { bsonType: "string", minLength: 1, maxLength: 120 },
      sessionCount: { bsonType: "int", minimum: 1, maximum: 52 },
      minutesPerSession: { bsonType: "int", minimum: 15, maximum: 240 },
      durationWeeks: { bsonType: "int", minimum: 1, maximum: 52 },
      channels: { bsonType: "array", minItems: 1, items: { enum: [...CHANNELS] } },
      responseTimeText: { bsonType: "string", maxLength: 120 },
      includedItems: { bsonType: "array", maxItems: 20, items: { bsonType: "string", minLength: 1, maxLength: 200 } },
      priceCents: { bsonType: ["int", "long"], minimum: 0 },
      currency: { bsonType: "string", minLength: 3, maxLength: 3 },
      depositRule: {
        bsonType: "object",
        required: ["type"],
        properties: {
          type: { enum: ["none", "percent", "fixed"] },
          percent: { bsonType: "int", minimum: 1, maximum: 100 },
          amountCents: { bsonType: ["int", "long"], minimum: 1 },
        },
        additionalProperties: false,
      },
      installmentsAllowed: { bsonType: "bool" },
      stripePriceId: { bsonType: "string", maxLength: 255 },
      order: { bsonType: "int", minimum: 0 },
      active: { bsonType: "bool" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};
