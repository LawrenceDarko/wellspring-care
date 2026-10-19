import "server-only";
import type { Db, ObjectId } from "mongodb";
import { isRole, type Role } from "../auth/capabilities";
import type { UserRole } from "./schemas/identity";

// Read path for user_roles. System-level (no AuthContext) because it is what
// builds the AuthContext: called only by the Auth.js session callback.
// Grants/revokes (super_admin, audit logged, PRD §2) come with that task.

export async function listRolesForUser(db: Db, userId: ObjectId): Promise<Role[]> {
  const docs = await db
    .collection<UserRole>("user_roles")
    .find({ userId }, { projection: { role: 1, _id: 0 } })
    .limit(50)
    .toArray();
  return docs.map((d) => d.role).filter(isRole);
}
