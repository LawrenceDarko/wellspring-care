import { ObjectId, type Document } from "mongodb";
import { z } from "zod";
import { CONTACT_LIMITS } from "../../../domain/contact.ts";

// PRD §3.2 / §4.1: general inquiries from the public Contact form. Only what the
// person typed plus status + timestamps: no IP, user agent or form token.
// Retention: 3 years after close (PRD §13.7). Keep zod and `$jsonSchema` in step.

export const CONTACT_STATUSES = ["new", "closed"] as const;

export const contactMessageSchema = z.strictObject({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1).max(CONTACT_LIMITS.name),
  email: z.email().max(CONTACT_LIMITS.email),
  message: z.string().min(1).max(CONTACT_LIMITS.message),
  status: z.enum(CONTACT_STATUSES),
  closedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

export const contactMessageValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email", "message", "status", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: CONTACT_LIMITS.name },
      email: { bsonType: "string", minLength: 3, maxLength: CONTACT_LIMITS.email },
      message: { bsonType: "string", minLength: 1, maxLength: CONTACT_LIMITS.message },
      status: { enum: [...CONTACT_STATUSES] },
      closedAt: { bsonType: "date" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    additionalProperties: false,
  },
};
