import { describe, expect, it } from "vitest";
import { ConfigError, parseConfig } from "@/server/config";

const base = {
  MONGODB_URI: "mongodb://localhost:27017",
  AUTH_SECRET: "a".repeat(32),
  FIELD_ENC_KEY: Buffer.alloc(32, 1).toString("base64"),
};

describe("parseConfig", () => {
  it("accepts required keys and applies defaults", () => {
    const { env } = parseConfig(base);
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.MONGODB_DB).toBe("wellspring");
    expect(env.FIELD_ENC_KID).toBe("k1");
  });

  it("reports every integration false when optional keys are missing or empty", () => {
    const { integrations } = parseConfig({ ...base, STRIPE_SECRET_KEY: "", RESEND_API_KEY: "  " });
    expect(integrations).toEqual({ stripe: false, email: false, googleCalendar: false });
  });

  it("requires every key of an integration before reporting it configured", () => {
    expect(parseConfig({ ...base, STRIPE_SECRET_KEY: "sk_test_x" }).integrations.stripe).toBe(false);
    expect(parseConfig({ ...base, RESEND_API_KEY: "re_x" }).integrations.email).toBe(false);

    const { integrations } = parseConfig({
      ...base,
      STRIPE_SECRET_KEY: "sk_test_x",
      STRIPE_WEBHOOK_SECRET: "whsec_x",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_x",
      RESEND_API_KEY: "re_x",
      EMAIL_FROM: "Care <care@example.org>",
      GOOGLE_CALENDAR_CLIENT_ID: "id",
      GOOGLE_CALENDAR_CLIENT_SECRET: "secret",
    });
    expect(integrations).toEqual({ stripe: true, email: true, googleCalendar: true });
  });

  it.each(["MONGODB_URI", "AUTH_SECRET", "FIELD_ENC_KEY"] as const)("throws when %s is missing", (key) => {
    expect(() => parseConfig({ ...base, [key]: undefined })).toThrow(ConfigError);
    expect(() => parseConfig({ ...base, [key]: "" })).toThrow(new RegExp(key));
  });

  it("rejects malformed required values without echoing them", () => {
    const bad = { ...base, FIELD_ENC_KEY: Buffer.alloc(16).toString("base64"), MONGODB_URI: "postgres://secret-host" };
    try {
      parseConfig(bad);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError);
      const msg = (e as Error).message;
      expect(msg).toMatch(/FIELD_ENC_KEY/);
      expect(msg).toMatch(/MONGODB_URI/);
      expect(msg).not.toContain("secret-host");
    }
  });
});
