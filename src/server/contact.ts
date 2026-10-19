import "server-only";
import type { Db } from "mongodb";
import { contactInputSchema, CONTACT_FIELDS, type ContactField } from "@/domain/contact";
import { insertContactMessage } from "./data/contact-messages";
import { getDb } from "./db";
import { EmailNotConfiguredError, sendEmail, type EmailMessage } from "./email";
import { errorFields, log } from "./log";
import { checkRateLimit, clientIp, guardPublicForm, RATE_LIMITS } from "./rate-limit";

// General inquiry submission (PRD §4.1, §13.5, §14): guard -> validate -> rate
// limit -> store -> generic confirmation email. Dependencies are injectable so
// tests run without Next request context.

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "invalid"; fieldErrors: Partial<Record<ContactField, string>> }
  | { status: "error"; message: string };

export const CONTACT_MESSAGES = {
  expired: "This form has expired. Please reload the page and try again.",
  rateLimited: "Too many messages from this connection. Please try again later.",
  failed: "We could not send your message. Please try again later.",
} as const;

// Generic by design (PRD §14): never echoes the message or name.
export const CONFIRMATION_EMAIL = {
  subject: "We received your message",
  text: "Thank you for contacting us. We received your message and will reply by email.\n\nThis inbox is not monitored continuously. In an emergency call 911. For a mental-health crisis call or text 988.",
} as const;

export type ContactDeps = {
  headers: Headers;
  db?: Db;
  now?: Date;
  secret?: string;
  send?: (message: EmailMessage) => Promise<void>;
};

export async function submitContactForm(form: FormData, deps: ContactDeps): Promise<ContactState> {
  const now = deps.now ?? new Date();
  const guard = guardPublicForm(form, { now, secret: deps.secret });
  if (!guard.ok) {
    log.warn("contact.guard_rejected", { action: guard.reason });
    // A filled honeypot looks like success so bots learn nothing; nothing is stored.
    if (guard.reason === "honeypot") return { status: "sent" };
    return { status: "error", message: CONTACT_MESSAGES.expired };
  }

  const parsed = contactInputSchema.safeParse({
    name: form.get("name") ?? "",
    email: form.get("email") ?? "",
    message: form.get("message") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = CONTACT_FIELDS.find((f) => f === issue.path[0]);
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { status: "invalid", fieldErrors };
  }

  const db = deps.db ?? (await getDb());
  const limitDeps = { db, now, secret: deps.secret };
  const byIp = await checkRateLimit("contactIp", clientIp(deps.headers), RATE_LIMITS.publicForm, limitDeps);
  const byEmail = byIp.allowed
    ? await checkRateLimit("contactEmail", parsed.data.email, RATE_LIMITS.publicForm, limitDeps)
    : byIp;
  if (!byIp.allowed || !byEmail.allowed) {
    log.warn("contact.rate_limited", { action: byIp.allowed ? "contactEmail" : "contactIp" });
    return { status: "error", message: CONTACT_MESSAGES.rateLimited };
  }

  const id = await insertContactMessage(db, parsed.data, now);
  log.info("contact.received", { collection: "contact_messages", targetId: id.toHexString() });

  try {
    await (deps.send ?? sendEmail)({ to: parsed.data.email, template: "inquiry_received", ...CONFIRMATION_EMAIL });
  } catch (err) {
    // The message is stored; a missing or failing transport only skips the receipt.
    if (!(err instanceof Error)) throw err;
    log.warn(err instanceof EmailNotConfiguredError ? "contact.email_not_configured" : "contact.email_failed", errorFields(err));
  }
  return { status: "sent" };
}
