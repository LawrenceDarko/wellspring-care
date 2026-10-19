import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthConfig } from "@/server/auth";
import { ensureCollections } from "@/server/data/registry";
import { createOutboxTransport } from "@/server/email";
import { startMongo, type TestMongo } from "./helpers/mongo";

const BASE = "http://localhost:3000/api/auth";
const SECRET = "test-secret-test-secret-test-secret-0123";
const EMAIL = "member@example.org";

// Collects Set-Cookie values into a Cookie header, like a browser would.
function cookieJar() {
  const jar = new Map<string, string>();
  return {
    take(res: Response) {
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";");
        const i = pair.indexOf("=");
        jar.set(pair.slice(0, i), pair.slice(i + 1));
      }
    },
    header: () => [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
    has: (name: string) => jar.has(name),
  };
}

describe("Auth.js email sign-in (integration)", () => {
  let mongo: TestMongo;
  let auth: ReturnType<typeof NextAuth>;

  beforeAll(async () => {
    mongo = await startMongo("wellspring_auth_test");
    await ensureCollections(mongo.db);
    const outbox = createOutboxTransport(async () => mongo.db);
    auth = NextAuth(
      createAuthConfig({
        client: mongo.client,
        dbName: mongo.db.databaseName,
        secret: SECRET,
        production: false,
        send: (m) => outbox.send(m),
      }),
    );
  }, 120_000);
  afterAll(async () => mongo?.stop());

  it("creates a verification token and outbox entry, then a DB session carrying roles", async () => {
    const jar = cookieJar();

    const csrfRes = await auth.handlers.GET(new NextRequest(`${BASE}/csrf`));
    jar.take(csrfRes);
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
    expect(csrfToken).toBeTruthy();

    const signInRes = await auth.handlers.POST(
      new NextRequest(`${BASE}/signin/email`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar.header() },
        body: new URLSearchParams({ email: EMAIL, csrfToken, callbackUrl: "http://localhost:3000/" }),
      }),
    );
    expect(signInRes.status).toBe(302);
    const verifyUrl = signInRes.headers.get("location")!;
    expect(verifyUrl).toContain("/api/auth/verify-request");
    const verifyRes = await auth.handlers.GET(new NextRequest(verifyUrl));
    expect(verifyRes.headers.get("location")).toContain("/sign-in/check-email");

    // Verification token stored hashed, never the raw token.
    const tokens = await mongo.db.collection("verification_tokens").find({ identifier: EMAIL }).toArray();
    expect(tokens).toHaveLength(1);

    // Magic link went through sendEmail's outbox transport, generic subject.
    const mails = await mongo.db.collection("email_outbox").find({ to: EMAIL }).toArray();
    expect(mails).toHaveLength(1);
    expect(mails[0]).toMatchObject({ template: "magic_link", subject: "Your sign-in link" });
    const link = /(http:\/\/localhost:3000\/api\/auth\/callback\/email\?\S+)/.exec(mails[0].text)?.[1];
    expect(link).toBeTruthy();
    const rawToken = new URL(link!).searchParams.get("token")!;
    expect(tokens[0].token).not.toBe(rawToken);
    expect(tokens[0].token).toBe(createHash("sha256").update(`${rawToken}${SECRET}`).digest("hex"));

    // Following the link consumes the token, creates the user and a DB session.
    const cbRes = await auth.handlers.GET(new NextRequest(link!, { headers: { cookie: jar.header() } }));
    expect(cbRes.status).toBe(302);
    jar.take(cbRes);
    expect(jar.has("authjs.session-token")).toBe(true);
    expect(await mongo.db.collection("verification_tokens").countDocuments({ identifier: EMAIL })).toBe(0);
    const user = await mongo.db.collection("users").findOne({ email: EMAIL });
    expect(user).not.toBeNull();
    expect(await mongo.db.collection("sessions").countDocuments({ userId: user!._id })).toBe(1);

    // Session callback reads user_roles.
    const now = new Date();
    await mongo.db.collection("user_roles").insertOne({ userId: user!._id, role: "client", createdAt: now, updatedAt: now });
    const sessionRes = await auth.handlers.GET(new NextRequest(`${BASE}/session`, { headers: { cookie: jar.header() } }));
    const session = (await sessionRes.json()) as { user: { id: string; email: string; roles: string[] } };
    expect(session.user).toMatchObject({ id: user!._id.toHexString(), email: EMAIL, roles: ["client"] });
  });

  it("rejects an unknown role in user_roles at the DB validator", async () => {
    const now = new Date();
    await expect(
      mongo.db.collection("user_roles").insertOne({ userId: new ObjectId(), role: "god", createdAt: now, updatedAt: now }),
    ).rejects.toThrow(/validation/i);
  });
});
