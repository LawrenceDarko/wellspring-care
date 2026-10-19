import { ObjectId, type Document } from "mongodb";
import { z } from "zod";

// PRD §3.2 content: events (public listings) and testimonials. Keep zod and
// `$jsonSchema` in step. Relative imports only (loaded by Node).
// A testimonial can only be published with a consent record id (PRD §3.2,
// §4.3); the public read also checks that consent is granted and not revoked.

const timestamps = { createdAt: z.date(), updatedAt: z.date() };
const timestampProps = { createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" } };

// --- events ----------------------------------------------------------------

export const eventSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  title: z.string().min(1).max(160),
  summary: z.string().max(500),
  startsAt: z.date(),
  endsAt: z.date().optional(),
  locationText: z.string().max(200),
  published: z.boolean(),
  ...timestamps,
});
export type EventListing = z.infer<typeof eventSchema>;

export const eventValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "title", "summary", "startsAt", "locationText", "published", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      slug: { bsonType: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 80 },
      title: { bsonType: "string", minLength: 1, maxLength: 160 },
      summary: { bsonType: "string", maxLength: 500 },
      startsAt: { bsonType: "date" },
      endsAt: { bsonType: "date" },
      locationText: { bsonType: "string", maxLength: 200 },
      published: { bsonType: "bool" },
      ...timestampProps,
    },
    additionalProperties: false,
  },
};

// --- testimonials ----------------------------------------------------------

export const testimonialSchema = z
  .object({
    _id: z.instanceof(ObjectId).optional(),
    quote: z.string().min(1).max(1000),
    attribution: z.string().min(1).max(120),
    consentRecordId: z.instanceof(ObjectId).optional(),
    published: z.boolean(),
    order: z.number().int().min(0),
    ...timestamps,
  })
  .refine((t) => !t.published || t.consentRecordId, {
    message: "consentRecordId is required to publish",
    path: ["consentRecordId"],
  });
export type Testimonial = z.infer<typeof testimonialSchema>;

export const testimonialValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["quote", "attribution", "published", "order", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      quote: { bsonType: "string", minLength: 1, maxLength: 1000 },
      attribution: { bsonType: "string", minLength: 1, maxLength: 120 },
      consentRecordId: { bsonType: "objectId" },
      published: { bsonType: "bool" },
      order: { bsonType: "int", minimum: 0 },
      ...timestampProps,
    },
    additionalProperties: false,
    anyOf: [{ properties: { published: { enum: [false] } } }, { required: ["consentRecordId"] }],
  },
};
