import { ObjectId, type Document } from "mongodb";
import { z } from "zod";
import { ROLES } from "../../auth/capabilities.ts";

// PRD §3.1 identity collections. `users`, `accounts`, `sessions` and
// `verification_tokens` belong to the Auth.js MongoDB adapter (its own shape,
// no validator here). `user_roles` is ours: one doc per (user, role) grant.
// Keep zod and `$jsonSchema` in step. Relative imports only (loaded by Node).

export const userRoleSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.instanceof(ObjectId),
  role: z.enum(ROLES),
  grantedBy: z.instanceof(ObjectId).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserRole = z.infer<typeof userRoleSchema>;

export const userRoleValidator: Document = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "role", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      role: { enum: [...ROLES] },
      grantedBy: { bsonType: "objectId" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
    additionalProperties: false,
  },
};
