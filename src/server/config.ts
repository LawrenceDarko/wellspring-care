import "server-only";
import { z } from "zod";

// PRD §17: env validated with zod at boot. Required keys throw; optional
// integrations resolve to booleans so the UI can show "Not configured".

// `.env.example` ships keys with empty values; treat "" as unset.
const optional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);
const required = (name: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string({ error: `${name} is required` }),
  );
const withDefault = (fallback: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().default(fallback),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: withDefault("http://localhost:3000").pipe(z.url()),

  MONGODB_URI: required("MONGODB_URI").pipe(
    z.string().regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must be a mongodb:// or mongodb+srv:// URI"),
  ),
  MONGODB_DB: withDefault("wellspring"),

  AUTH_SECRET: required("AUTH_SECRET").pipe(z.string().min(32, "AUTH_SECRET must be at least 32 characters")),
  AUTH_URL: optional.pipe(z.url().optional()),

  FIELD_ENC_KEY: required("FIELD_ENC_KEY").refine(
    (v) => /^[A-Za-z0-9+/]+={0,2}$/.test(v) && Buffer.from(v, "base64").length === 32,
    "FIELD_ENC_KEY must be base64-encoded 32 bytes",
  ),
  FIELD_ENC_KID: withDefault("k1"),

  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,

  GOOGLE_CALENDAR_CLIENT_ID: optional,
  GOOGLE_CALENDAR_CLIENT_SECRET: optional,

  CRON_SECRET: optional,
});

export type Env = z.infer<typeof envSchema>;

export type Config = {
  env: Env;
  integrations: { stripe: boolean; email: boolean; googleCalendar: boolean };
};

export class ConfigError extends Error {
  constructor(public readonly issues: string[]) {
    // Messages name keys only, never values.
    super(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "ConfigError";
  }
}

export function parseConfig(source: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`),
    );
  }
  const env = result.data;
  return {
    env,
    integrations: {
      // An integration counts as configured only when every key it needs is set.
      stripe: Boolean(
        env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      ),
      email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
      googleCalendar: Boolean(env.GOOGLE_CALENDAR_CLIENT_ID && env.GOOGLE_CALENDAR_CLIENT_SECRET),
    },
  };
}

let cached: Config | undefined;

/** Validated config from `process.env`, parsed once per process. */
export function getConfig(): Config {
  cached ??= parseConfig(process.env);
  return cached;
}
