import "server-only";
import type { ObjectId } from "mongodb";
import { capabilitiesFor, type Capability } from "./capabilities";

// PRD §13.1: every repository call receives an AuthContext. Built server-side
// from the session + user_roles + assignments; never from client input.

export type AssignmentKind = "cohort" | "care_request" | "prayer_request" | "booking";

export type AuthContext = {
  readonly userId: ObjectId;
  readonly capabilities: ReadonlySet<Capability>;
  /** Ids of records this user is assigned to, by kind (e.g. cohorts they facilitate). */
  readonly assignments: Readonly<Partial<Record<AssignmentKind, readonly ObjectId[]>>>;
};

export function buildAuthContext(input: {
  userId: ObjectId;
  roles: readonly string[];
  assignments?: AuthContext["assignments"];
}): AuthContext {
  return {
    userId: input.userId,
    capabilities: capabilitiesFor(input.roles),
    assignments: input.assignments ?? {},
  };
}

export class AuthError extends Error {
  constructor(
    readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function hasCapability(ctx: AuthContext | null | undefined, cap: Capability): boolean {
  return !!ctx && ctx.capabilities.has(cap);
}

/** Throws 401 when there is no signed-in user. */
export function requireUser(ctx: AuthContext | null | undefined): AuthContext {
  if (!ctx) throw new AuthError(401, "Sign-in required");
  return ctx;
}

/** Throws 401 without a user, 403 when the capability is missing. */
export function requireCapability(ctx: AuthContext | null | undefined, cap: Capability): AuthContext {
  const user = requireUser(ctx);
  if (!user.capabilities.has(cap)) throw new AuthError(403, "Not permitted");
  return user;
}
