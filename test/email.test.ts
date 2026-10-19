import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ensureCollections } from "@/server/data/registry";
import { insertOutboxEmail, listOutboxEmails } from "@/server/data/email-outbox";
import { OUTBOX_TTL_MS } from "@/server/data/schemas/system";
import {
  createOutboxTransport,
  EmailNotConfiguredError,
  selectTransport,
  sendEmail,
  type EmailMessage,
} from "@/server/email";
import { startMongo, type TestMongo } from "./helpers/mongo";

const message: EmailMessage = {
  to: "member@example.org",
  subject: "Your sign-in link",
  text: "Use this link to sign in: http://localhost:3000/api/auth/callback/email?token=abc",
  template: "magic_link",
};

const cfg = (NODE_ENV: "development" | "test" | "production", resend: boolean) => ({
  env: {
    NODE_ENV,
    RESEND_API_KEY: resend ? "re_test_key" : undefined,
    EMAIL_FROM: resend ? "Wellspring <care@example.org>" : undefined,
  },
  integrations: { email: resend },
});

describe("transport selection", () => {
  const noDb = () => Promise.reject(new Error("db not used"));

  it("uses Resend when configured, in any environment", () => {
    expect(selectTransport(cfg("production", true), noDb)?.kind).toBe("resend");
    expect(selectTransport(cfg("development", true), noDb)?.kind).toBe("resend");
  });

  it("falls back to the outbox outside production", () => {
    expect(selectTransport(cfg("development", false), noDb)?.kind).toBe("outbox");
    expect(selectTransport(cfg("test", false), noDb)?.kind).toBe("outbox");
  });

  it("has no transport in production without Resend, and sending says so", async () => {
    expect(selectTransport(cfg("production", false), noDb)).toBeNull();
    await expect(sendEmail(message, null)).rejects.toBeInstanceOf(EmailNotConfiguredError);
    await expect(sendEmail(message, null)).rejects.toThrow("Email is not configured");
  });
});

describe("outbox", () => {
  let mongo: TestMongo;

  beforeAll(async () => {
    mongo = await startMongo("wellspring_email_test");
    await ensureCollections(mongo.db);
  }, 120_000);
  afterAll(async () => mongo?.stop());
  beforeEach(async () => {
    await mongo.db.collection("email_outbox").deleteMany({});
  });

  it("sendEmail through the outbox transport stores the message with a TTL", async () => {
    const before = Date.now();
    await sendEmail(message, createOutboxTransport(async () => mongo.db));
    const [doc] = await listOutboxEmails(mongo.db);
    expect(doc).toMatchObject({ to: message.to, subject: message.subject, text: message.text, template: "magic_link" });
    expect(doc.expiresAt.getTime()).toBeGreaterThanOrEqual(before + OUTBOX_TTL_MS);
    const indexes = await mongo.db.collection("email_outbox").indexes();
    expect(indexes.find((i) => i.name === "expiresAt_ttl")?.expireAfterSeconds).toBe(0);
  });

  it("lists newest first", async () => {
    await insertOutboxEmail(mongo.db, { ...message, subject: "first" }, new Date("2026-01-01"));
    await insertOutboxEmail(mongo.db, { ...message, subject: "second" }, new Date("2026-01-02"));
    expect((await listOutboxEmails(mongo.db)).map((d) => d.subject)).toEqual(["second", "first"]);
  });

  it("rejects unknown templates and bad recipients (app and DB validators)", async () => {
    await expect(
      insertOutboxEmail(mongo.db, { ...message, template: "nope" as EmailMessage["template"] }),
    ).rejects.toThrow();
    await expect(insertOutboxEmail(mongo.db, { ...message, to: "not-an-email" })).rejects.toThrow();
    const now = new Date();
    await expect(
      mongo.db.collection("email_outbox").insertOne({ ...message, template: "nope", expiresAt: now, createdAt: now, updatedAt: now }),
    ).rejects.toThrow(/validation/i);
  });
});
