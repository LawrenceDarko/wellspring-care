import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CONFIRMATION_EMAIL, CONTACT_MESSAGES, submitContactForm } from "@/server/contact";
import { ensureCollections } from "@/server/data/registry";
import { createOutboxTransport, sendEmail, type EmailMessage } from "@/server/email";
import { FORM_TOKEN_FIELD, HONEYPOT_FIELD, publicFormToken, RATE_LIMITS } from "@/server/rate-limit";
import { startMongo, type TestMongo } from "./helpers/mongo";

const secret = "s".repeat(32);
const rendered = new Date("2026-10-19T12:00:00.000Z");
const now = new Date(rendered.getTime() + 10_000);
const valid = { name: "Ruth Example", email: "ruth@example.org", message: "When are the next renewal cohorts?" };

function formOf(fields: Record<string, string>, token = publicFormToken({ now: rendered, secret })): FormData {
  const form = new FormData();
  form.set(FORM_TOKEN_FIELD, token);
  form.set(HONEYPOT_FIELD, "");
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}

describe("contact form submission", () => {
  let mongo: TestMongo;
  let sent: EmailMessage[];

  beforeAll(async () => {
    mongo = await startMongo();
    await ensureCollections(mongo.db);
  });
  afterAll(async () => mongo.stop());
  beforeEach(async () => {
    sent = [];
    await Promise.all(["contact_messages", "rate_limits", "email_outbox"].map((c) => mongo.db.collection(c).deleteMany({})));
  });

  const submit = (form: FormData, opts: { ip?: string; send?: (m: EmailMessage) => Promise<void> } = {}) =>
    submitContactForm(form, {
      headers: new Headers({ "x-forwarded-for": opts.ip ?? "203.0.113.7" }),
      db: mongo.db,
      now,
      secret,
      send: opts.send ?? (async (m) => void sent.push(m)),
    });

  it("stores only the allowlisted fields and sends a generic confirmation", async () => {
    const result = await submit(formOf({ ...valid, name: "  Ruth Example ", extra: "x", role: "admin" }));
    expect(result).toEqual({ status: "sent" });

    const docs = await mongo.db.collection("contact_messages").find({}).toArray();
    expect(docs).toHaveLength(1);
    expect(Object.keys(docs[0]).sort()).toEqual(["_id", "createdAt", "email", "message", "name", "status", "updatedAt"]);
    expect(docs[0]).toMatchObject({ ...valid, status: "new", createdAt: now, updatedAt: now });

    expect(sent).toEqual([{ to: valid.email, template: "inquiry_received", ...CONFIRMATION_EMAIL }]);
    const email = `${sent[0].subject}\n${sent[0].text}`;
    expect(email).not.toContain(valid.name);
    expect(email).not.toContain(valid.message);
  });

  it("writes the confirmation to the dev outbox through sendEmail", async () => {
    const outbox = createOutboxTransport(async () => mongo.db);
    await submit(formOf(valid), { send: (m) => sendEmail(m, outbox) });
    const emails = await mongo.db.collection("email_outbox").find({}).toArray();
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ to: valid.email, subject: CONFIRMATION_EMAIL.subject, template: "inquiry_received" });
  });

  it("still stores the message when email is not configured", async () => {
    const result = await submit(formOf(valid), { send: (m) => sendEmail(m, null) });
    expect(result).toEqual({ status: "sent" });
    expect(await mongo.db.collection("contact_messages").countDocuments()).toBe(1);
  });

  it("filled honeypot looks like success but stores and sends nothing", async () => {
    const form = formOf(valid);
    form.set(HONEYPOT_FIELD, "https://spam.example");
    expect(await submit(form)).toEqual({ status: "sent" });
    expect(await mongo.db.collection("contact_messages").countDocuments()).toBe(0);
    expect(await mongo.db.collection("rate_limits").countDocuments()).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("rejects a forged, too-fast or missing form token", async () => {
    const forged = publicFormToken({ now: rendered, secret: "x".repeat(32) });
    const tooFast = publicFormToken({ now: new Date(now.getTime() - 500), secret });
    const missing = formOf(valid);
    missing.delete(FORM_TOKEN_FIELD);
    for (const form of [formOf(valid, forged), formOf(valid, tooFast), missing]) {
      expect(await submit(form)).toEqual({ status: "error", message: CONTACT_MESSAGES.expired });
    }
    expect(await mongo.db.collection("contact_messages").countDocuments()).toBe(0);
  });

  it("returns field errors for invalid input without storing", async () => {
    const result = await submit(formOf({ name: " ", email: "not-an-email", message: "m".repeat(4001) }));
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["email", "message", "name"]);
    expect(await mongo.db.collection("contact_messages").countDocuments()).toBe(0);
  });

  it("rate limits per IP and per email address", async () => {
    const { limit } = RATE_LIMITS.publicForm;
    for (let i = 0; i < limit; i++) {
      expect(await submit(formOf({ ...valid, email: `p${i}@example.org` }))).toEqual({ status: "sent" });
    }
    expect(await submit(formOf({ ...valid, email: "next@example.org" }))).toEqual({
      status: "error",
      message: CONTACT_MESSAGES.rateLimited,
    });

    // Same address from many connections is limited too (protects the confirmation recipient).
    for (let i = 0; i < limit; i++) await submit(formOf(valid), { ip: `198.51.100.${i}` });
    expect(await submit(formOf(valid), { ip: "198.51.100.200" })).toEqual({
      status: "error",
      message: CONTACT_MESSAGES.rateLimited,
    });
    expect(await mongo.db.collection("contact_messages").countDocuments()).toBe(limit * 2);
    const keys = (await mongo.db.collection("rate_limits").find({}).toArray()).map((d) => String(d.key));
    expect(keys.join(" ")).not.toMatch(/203\.0\.113|example\.org/);
  });
});
