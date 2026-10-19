import "server-only";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId, type MongoClient } from "mongodb";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import { cache } from "react";
import { getConfig } from "../config";
import { listRolesForUser } from "../data/user-roles";
import { getClient } from "../db";
import { sendEmail, type EmailMessage } from "../email";
import type { Role } from "./capabilities";
import { buildAuthContext, type AuthContext } from "./context";

// PRD §13.2: Auth.js v5, MongoDB adapter (users, accounts, sessions,
// verification_tokens), database sessions, email magic link sent through
// sendEmail() (Resend, or the dev outbox). Session cookie defaults are
// httpOnly + sameSite=lax; secure is forced in production.
// Kept inside src/server/auth/ so swapping Auth.js touches only this folder (ADR 001).

declare module "next-auth" {
  interface Session {
    user: { id: string; roles: Role[] } & DefaultSession["user"];
  }
}

export const MAGIC_LINK_MAX_AGE_S = 15 * 60;

export type AuthDeps = {
  client: MongoClient | Promise<MongoClient> | (() => Promise<MongoClient>);
  dbName: string;
  secret: string;
  production: boolean;
  send?: (message: EmailMessage) => Promise<void>;
};

async function resolveClient(client: AuthDeps["client"]): Promise<MongoClient> {
  return typeof client === "function" ? client() : client;
}

export function magicLinkEmail(to: string, url: string): EmailMessage {
  // Generic subject and body (PRD §14); the link itself is the only detail.
  return {
    to,
    subject: "Your sign-in link",
    text: `Use this link to sign in to Wellspring Care:\n\n${url}\n\nThe link expires in 15 minutes and works once. If you did not ask to sign in, you can ignore this email.`,
    template: "magic_link",
  };
}

export function createAuthConfig(deps: AuthDeps): NextAuthConfig {
  const send = deps.send ?? ((m: EmailMessage) => sendEmail(m));
  const email: EmailConfig = {
    id: "email",
    type: "email",
    name: "Email",
    maxAge: MAGIC_LINK_MAX_AGE_S,
    options: {},
    async sendVerificationRequest({ identifier, url }) {
      await send(magicLinkEmail(identifier, url));
    },
  };

  return {
    adapter: MongoDBAdapter(() => resolveClient(deps.client), { databaseName: deps.dbName }),
    session: { strategy: "database" },
    secret: deps.secret,
    useSecureCookies: deps.production ? true : undefined,
    providers: [email],
    pages: { signIn: "/sign-in", verifyRequest: "/sign-in/check-email", error: "/sign-in" },
    callbacks: {
      async session({ session, user }) {
        const db = (await resolveClient(deps.client)).db(deps.dbName);
        const roles = await listRolesForUser(db, new ObjectId(user.id));
        return { ...session, user: { ...session.user, id: user.id, roles } };
      },
    },
  };
}

// Config is built per request, so importing this module needs no env (build-safe).
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const { env } = getConfig();
  return createAuthConfig({
    client: getClient,
    dbName: env.MONGODB_DB,
    secret: env.AUTH_SECRET,
    production: env.NODE_ENV === "production",
  });
});

/** AuthContext for the current request, or null when signed out. Deduped per request. */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await auth();
  if (!session?.user?.id || !ObjectId.isValid(session.user.id)) return null;
  // Assignments (cohorts, care requests, ...) load here once those collections exist.
  return buildAuthContext({ userId: new ObjectId(session.user.id), roles: session.user.roles ?? [] });
});
