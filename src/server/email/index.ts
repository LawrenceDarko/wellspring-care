import "server-only";
import type { Db } from "mongodb";
import { Resend } from "resend";
import type { Config } from "../config";
import { getConfig } from "../config";
import { insertOutboxEmail } from "../data/email-outbox";
import type { EmailTemplate } from "../data/schemas/system";
import { getDb } from "../db";
import { log } from "../log";

// PRD §14: Resend when configured; otherwise the dev transport writes to
// `email_outbox` (viewable at /dev/outbox). Production without Resend has no
// transport: sending throws EmailNotConfiguredError so the UI can say so.
// Subjects and bodies stay generic; details live behind login.

export { EMAIL_TEMPLATES, type EmailTemplate } from "../data/schemas/system";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  template: EmailTemplate;
};

export type EmailTransport = {
  readonly kind: "resend" | "outbox";
  send(message: EmailMessage): Promise<void>;
};

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailSendError extends Error {
  constructor() {
    // Never carries recipient, subject or provider message.
    super("Email could not be sent");
    this.name = "EmailSendError";
  }
}

export function createResendTransport(opts: { apiKey: string; from: string }): EmailTransport {
  const client = new Resend(opts.apiKey);
  return {
    kind: "resend",
    async send(message) {
      const { error } = await client.emails.send({
        from: opts.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      });
      if (error) {
        log.error("email.send_failed", { integration: "resend", action: message.template });
        throw new EmailSendError();
      }
    },
  };
}

export function createOutboxTransport(db: () => Promise<Db>): EmailTransport {
  return {
    kind: "outbox",
    async send(message) {
      await insertOutboxEmail(await db(), message);
    },
  };
}

type TransportConfig = {
  env: Pick<Config["env"], "NODE_ENV" | "RESEND_API_KEY" | "EMAIL_FROM">;
  integrations: Pick<Config["integrations"], "email">;
};

/** Resend if configured, else outbox outside production, else null (not configured). */
export function selectTransport(config: TransportConfig, db: () => Promise<Db> = getDb): EmailTransport | null {
  const { env, integrations } = config;
  if (integrations.email && env.RESEND_API_KEY && env.EMAIL_FROM) {
    return createResendTransport({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM });
  }
  if (env.NODE_ENV !== "production") return createOutboxTransport(db);
  return null;
}

let cached: EmailTransport | null | undefined;

/** True when a transport exists (Resend, or the dev outbox outside production). */
export function emailAvailable(): boolean {
  cached ??= selectTransport(getConfig());
  return cached !== null;
}

export async function sendEmail(
  message: EmailMessage,
  transport: EmailTransport | null = (cached ??= selectTransport(getConfig())),
): Promise<void> {
  if (!transport) throw new EmailNotConfiguredError();
  await transport.send(message);
}
