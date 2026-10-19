import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getSettings, SETTINGS_DEFAULTS } from "@/server/data/settings";
import { ensureCollections } from "@/server/data/registry";
import { startMongo, type TestMongo } from "./helpers/mongo";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startMongo();
  await ensureCollections(mongo.db);
});
afterAll(async () => mongo.stop());
beforeEach(async () => {
  await mongo.db.collection("organization_settings").deleteMany({});
});

describe("getSettings", () => {
  it("returns defaults when the settings doc is missing", async () => {
    const settings = await getSettings(mongo.db);
    expect(settings).toEqual(SETTINGS_DEFAULTS);
    expect(settings.timezone).toBe("America/New_York");
    expect(settings.currency).toBe("USD");
    expect(settings.contactEmail).toBeUndefined();
  });

  it("returns a copy, not the frozen defaults object", async () => {
    const settings = await getSettings(mongo.db);
    expect(settings).not.toBe(SETTINGS_DEFAULTS);
    expect(Object.isFrozen(settings)).toBe(false);
  });

  it("merges the stored doc over defaults and strips internal fields", async () => {
    const now = new Date();
    await mongo.db.collection("organization_settings").insertOne({
      key: "default",
      name: "Test Chaplaincy",
      contactEmail: "hello@example.org",
      contactPhone: "+1 555 0100",
      timezone: "America/Chicago",
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    });
    const settings = await getSettings(mongo.db);
    expect(settings).toEqual({
      name: "Test Chaplaincy",
      tagline: SETTINGS_DEFAULTS.tagline,
      contactEmail: "hello@example.org",
      contactPhone: "+1 555 0100",
      timezone: "America/Chicago",
      currency: "USD",
    });
    expect(settings).not.toHaveProperty("_id");
    expect(settings).not.toHaveProperty("key");
    expect(settings).not.toHaveProperty("createdAt");
  });
});
