import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoServerError } from "mongodb";
import { collections, ensureCollections } from "@/server/data/registry";
import { startMongo, type TestMongo } from "./helpers/mongo";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startMongo();
}, 120_000);

afterAll(async () => {
  await mongo?.stop();
});

describe("ensureCollections", () => {
  it("is idempotent across two runs", async () => {
    await ensureCollections(mongo.db);
    await ensureCollections(mongo.db);

    for (const spec of collections) {
      const [info] = await mongo.db.listCollections({ name: spec.name }).toArray();
      expect(info, spec.name).toBeDefined();
      expect((info as { options?: { validator?: unknown } }).options?.validator).toEqual(spec.validator);
      const names = (await mongo.db.collection(spec.name).indexes()).map((i) => i.name);
      for (const idx of spec.indexes) expect(names).toContain(idx.name);
    }
  });

  it("creates a TTL index on rate_limits.expiresAt", async () => {
    const ttl = (await mongo.db.collection("rate_limits").indexes()).find((i) => i.name === "expiresAt_ttl");
    expect(ttl?.expireAfterSeconds).toBe(0);
  });

  it("accepts a valid organization_settings doc and rejects an invalid one", async () => {
    const coll = mongo.db.collection("organization_settings");
    const now = new Date();
    await coll.insertOne({
      key: "default",
      name: "Fictional Chaplaincy",
      timezone: "America/New_York",
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    });
    expect(await coll.countDocuments()).toBe(1);

    // Missing required `name`, wrong currency length, unknown field.
    await expect(
      coll.insertOne({ key: "other", currency: "US", extra: true, createdAt: now, updatedAt: now }),
    ).rejects.toBeInstanceOf(MongoServerError);
    // Singleton: a second "default" doc violates the unique index.
    await expect(
      coll.insertOne({ key: "default", name: "Dup", timezone: "UTC", currency: "USD", createdAt: now, updatedAt: now }),
    ).rejects.toThrow(/duplicate key/);
  });

  it("validates rate_limits and audit_logs docs", async () => {
    const now = new Date();
    await mongo.db.collection("rate_limits").insertOne({
      key: "contact:abc123",
      windowStart: now,
      count: 1,
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
      updatedAt: now,
    });
    await expect(
      mongo.db.collection("rate_limits").insertOne({ key: "x", count: -1, createdAt: now, updatedAt: now }),
    ).rejects.toBeInstanceOf(MongoServerError);

    await mongo.db.collection("audit_logs").insertOne({ actorId: null, action: "settings.update", createdAt: now, updatedAt: now });
    await expect(
      mongo.db.collection("audit_logs").insertOne({ action: "", createdAt: now, updatedAt: now }),
    ).rejects.toBeInstanceOf(MongoServerError);
  });
});
