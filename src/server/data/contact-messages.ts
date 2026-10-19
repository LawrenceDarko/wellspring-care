import "server-only";
import type { Db, ObjectId } from "mongodb";
import type { ContactInput } from "@/domain/contact";
import { contactMessageSchema, type ContactMessage } from "./schemas/contact";

// Public write (PRD §4.1): anonymous visitors create inquiries, so no AuthContext.
// Staff reads come later through a scoped repository (capability-checked).

/** Stores exactly name, email, message, status "new" and timestamps. */
export async function insertContactMessage(db: Db, input: ContactInput, now = new Date()): Promise<ObjectId> {
  const doc = contactMessageSchema.parse({
    name: input.name,
    email: input.email,
    message: input.message,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });
  const result = await db.collection<ContactMessage>("contact_messages").insertOne(doc);
  return result.insertedId;
}
