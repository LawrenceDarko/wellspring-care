import { ObjectId } from "mongodb";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildAuthContext } from "@/server/auth/context";
import {
  anyScope,
  assignedScope,
  ownerScope,
  scopedCollection,
  UnscopedQueryError,
  type ScopeFn,
} from "@/server/data/base";
import { startMongo, type TestMongo } from "../helpers/mongo";

type Doc = { _id: ObjectId; ownerId: ObjectId; title: string };

let mongo: TestMongo;
const alice = buildAuthContext({ userId: new ObjectId(), roles: ["client"] });
const bob = buildAuthContext({ userId: new ObjectId(), roles: ["client"] });
const aliceDoc = new ObjectId();
const bobDoc = new ObjectId();

beforeAll(async () => {
  mongo = await startMongo("authz_base_test");
  await mongo.db.collection<Doc>("things").insertMany([
    { _id: aliceDoc, ownerId: alice.userId, title: "a" },
    { _id: bobDoc, ownerId: bob.userId, title: "b" },
  ]);
}, 120_000);

afterAll(async () => {
  await mongo?.stop();
});

describe("scopedCollection", () => {
  it("owner scope returns own records and null for another user's (IDOR)", async () => {
    const things = scopedCollection<Doc>(mongo.db, "things", ownerScope("ownerId"));
    expect((await things.findOne(alice, { _id: aliceDoc }))?.title).toBe("a");
    expect(await things.findOne(alice, { _id: bobDoc })).toBeNull();
    expect((await things.find(alice, {})).map((d) => d.title)).toEqual(["a"]);
    expect(await things.countDocuments(bob, {})).toBe(1);
  });

  it("caller filter cannot widen the scope", async () => {
    const things = scopedCollection<Doc>(mongo.db, "things", ownerScope("ownerId"));
    const widened = await things.find(alice, { $or: [{ ownerId: bob.userId }, { title: "b" }] });
    expect(widened).toEqual([]);
  });

  it("writes outside scope match nothing", async () => {
    const things = scopedCollection<Doc>(mongo.db, "things", ownerScope("ownerId"));
    const upd = await things.updateOne(alice, { _id: bobDoc }, { $set: { title: "hacked" } });
    expect(upd.matchedCount).toBe(0);
    const del = await things.deleteOne(alice, { _id: bobDoc });
    expect(del.deletedCount).toBe(0);
    expect((await things.findOne(bob, { _id: bobDoc }))?.title).toBe("b");
  });

  it("refuses an empty (unscoped) scope", async () => {
    const all: ScopeFn<Doc> = () => ({});
    const things = scopedCollection<Doc>(mongo.db, "things", all);
    await expect(things.find(alice, {})).rejects.toBeInstanceOf(UnscopedQueryError);
    await expect(things.findOne(alice, { _id: aliceDoc })).rejects.toBeInstanceOf(UnscopedQueryError);
  });

  it("null scope denies: empty reads, no-op writes", async () => {
    const things = scopedCollection<Doc>(mongo.db, "things", () => null);
    expect(await things.findOne(alice, { _id: aliceDoc })).toBeNull();
    expect(await things.find(alice, {})).toEqual([]);
    expect(await things.countDocuments(alice, {})).toBe(0);
    expect((await things.updateOne(alice, {}, { $set: { title: "x" } })).matchedCount).toBe(0);
  });

  it("assigned scope needs both the capability and the assignment", async () => {
    const scope = anyScope<Doc>(ownerScope("ownerId"), assignedScope("care:provide", "care_request"));
    const things = scopedCollection<Doc>(mongo.db, "things", scope);
    const chaplain = buildAuthContext({
      userId: new ObjectId(),
      roles: ["chaplain"],
      assignments: { care_request: [aliceDoc] },
    });
    const unassignedChaplain = buildAuthContext({ userId: new ObjectId(), roles: ["chaplain"] });
    const assignedNoCap = buildAuthContext({
      userId: new ObjectId(),
      roles: ["client"],
      assignments: { care_request: [aliceDoc] },
    });
    expect((await things.find(chaplain, {})).map((d) => d.title)).toEqual(["a"]);
    expect(await things.find(unassignedChaplain, {})).toEqual([]);
    expect(await things.find(assignedNoCap, {})).toEqual([]);
  });
});
