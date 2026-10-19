import { ObjectId } from "mongodb";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordAudit, sanitizeAuditMeta } from "@/server/audit";
import { buildAuthContext } from "@/server/auth/context";
import { ensureCollections } from "@/server/data/registry";
import { createLogger, errorFields, type LogRecord } from "@/server/log";
import { startMongo, type TestMongo } from "./helpers/mongo";

describe("logger", () => {
  const capture = () => {
    const records: LogRecord[] = [];
    return { records, logger: createLogger((r) => records.push(r)) };
  };

  it("drops non-allowlisted keys and keeps allowlisted ones", () => {
    const { records, logger } = capture();
    logger.info("intake.submitted", {
      requestId: "r1",
      status: 201,
      email: "someone@example.com",
      prayerText: "heal my mother",
      answers: "private",
    });
    expect(records).toHaveLength(1);
    const [rec] = records;
    expect(rec).toMatchObject({ level: "info", event: "intake.submitted", requestId: "r1", status: 201, dropped: 3 });
    const line = JSON.stringify(rec);
    expect(line).not.toContain("someone@example.com");
    expect(line).not.toContain("heal my mother");
    expect(line).not.toContain("prayerText");
  });

  it("drops objects, arrays and errors even under allowlisted keys", () => {
    const { records, logger } = capture();
    logger.error("boom", {
      targetId: { note: "secret body" },
      count: [1, 2],
      errorName: new Error("secret in message"),
      durationMs: Number.NaN,
    });
    expect(JSON.stringify(records[0])).not.toContain("secret");
    expect(records[0].dropped).toBe(4);
  });

  it("strips query strings from route and truncates long strings", () => {
    const { records, logger } = capture();
    logger.warn("req", { route: "/api/intake?email=a@b.c#frag", requestId: "x".repeat(500) });
    expect(records[0].route).toBe("/api/intake");
    expect(String(records[0].requestId)).toHaveLength(200);
  });

  it("errorFields keeps only the error name", () => {
    expect(errorFields(new TypeError("contains user data"))).toEqual({ errorName: "TypeError" });
  });
});

describe("audit", () => {
  let mongo: TestMongo;
  beforeAll(async () => {
    mongo = await startMongo("audit_test");
    await ensureCollections(mongo.db);
  }, 120_000);
  afterAll(async () => {
    await mongo?.stop();
  });

  it("meta keeps allowlisted primitives only", () => {
    expect(
      sanitizeAuditMeta({ role: "facilitator", reason: "client in crisis", count: 3, collection: { x: 1 } }),
    ).toEqual({ role: "facilitator", count: 3 });
  });

  it("writes a validated entry with actor, target and sanitized meta", async () => {
    const admin = buildAuthContext({ userId: new ObjectId(), roles: ["super_admin"] });
    const targetId = new ObjectId();
    const id = await recordAudit(
      admin,
      { action: "role.grant", targetType: "user", targetId, meta: { role: "provider", email: "x@y.z" } },
      mongo.db,
    );
    const doc = await mongo.db.collection("audit_logs").findOne({ _id: id });
    expect(doc).toMatchObject({ actorId: admin.userId, action: "role.grant", targetType: "user", targetId });
    expect(doc?.meta).toEqual({ role: "provider" });
    expect(doc?.createdAt).toBeInstanceOf(Date);
  });

  it("records system actor as null and rejects unknown actions", async () => {
    const id = await recordAudit(null, { action: "refund", meta: { amountCents: 5000, currency: "USD" } }, mongo.db);
    expect((await mongo.db.collection("audit_logs").findOne({ _id: id }))?.actorId).toBeNull();
    await expect(recordAudit(null, { action: "note.peek" as never }, mongo.db)).rejects.toThrow(/Unknown audit action/);
  });
});
