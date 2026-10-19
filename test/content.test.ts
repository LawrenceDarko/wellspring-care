import { ObjectId } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { listPublishedTestimonials, listUpcomingEvents } from "@/server/data/content";
import { ensureCollections } from "@/server/data/registry";
import { testimonialSchema } from "@/server/data/schemas/content";
import { startMongo, type TestMongo } from "./helpers/mongo";

let mongo: TestMongo;
const now = new Date("2030-01-15T12:00:00Z");
const day = 24 * 60 * 60 * 1000;
const stamps = { createdAt: now, updatedAt: now };

beforeAll(async () => {
  mongo = await startMongo();
  await ensureCollections(mongo.db);
});
afterAll(async () => mongo.stop());
beforeEach(async () => {
  for (const c of ["events", "testimonials", "consent_records"]) await mongo.db.collection(c).deleteMany({});
});

function event(slug: string, startsAt: Date, extra: Record<string, unknown> = {}) {
  return { slug, title: slug, summary: "s", startsAt, locationText: "Fictional Hall", published: true, ...stamps, ...extra };
}

describe("listUpcomingEvents", () => {
  it("returns published, not-ended events soonest first", async () => {
    await mongo.db.collection("events").insertMany([
      event("later", new Date(now.getTime() + 10 * day)),
      event("past", new Date(now.getTime() - 2 * day)),
      event("ongoing", new Date(now.getTime() - day), { endsAt: new Date(now.getTime() + day) }),
      event("draft", new Date(now.getTime() + day), { published: false }),
      event("soon", new Date(now.getTime() + 2 * day)),
    ]);
    const events = await listUpcomingEvents({ now }, mongo.db);
    expect(events.map((e) => e.slug)).toEqual(["ongoing", "soon", "later"]);
    expect(Object.keys(events[1]!).sort()).toEqual(["id", "locationText", "slug", "startsAt", "summary", "title"]);
  });

  it("is empty when there are no events", async () => {
    expect(await listUpcomingEvents({ now }, mongo.db)).toEqual([]);
  });
});

describe("listPublishedTestimonials", () => {
  async function consent(granted: boolean, revokedAt?: Date) {
    const { insertedId } = await mongo.db
      .collection("consent_records")
      .insertOne({ type: "testimonial", granted, ...(revokedAt ? { revokedAt } : {}), ...stamps });
    return insertedId;
  }
  const t = (quote: string, extra: Record<string, unknown>) => ({
    quote,
    attribution: "Participant",
    published: true,
    order: 0,
    ...stamps,
    ...extra,
  });

  it("returns only published testimonials with granted, unrevoked consent", async () => {
    await mongo.db.collection("testimonials").insertMany([
      t("ok", { consentRecordId: await consent(true) }),
      t("revoked", { consentRecordId: await consent(true, now) }),
      t("denied", { consentRecordId: await consent(false) }),
      t("missing consent doc", { consentRecordId: new ObjectId() }),
      t("unpublished", { published: false, consentRecordId: await consent(true) }),
    ]);
    const list = await listPublishedTestimonials({}, mongo.db);
    expect(list.map((x) => x.quote)).toEqual(["ok"]);
    expect(Object.keys(list[0]!).sort()).toEqual(["attribution", "id", "quote"]);
  });

  it("is empty with no data, and publishing without consent is rejected", async () => {
    expect(await listPublishedTestimonials({}, mongo.db)).toEqual([]);
    await expect(mongo.db.collection("testimonials").insertOne(t("no consent", {}))).rejects.toThrow(
      /validation/i,
    );
    expect(testimonialSchema.safeParse(t("no consent", {})).success).toBe(false);
    await mongo.db.collection("testimonials").insertOne(t("draft", { published: false }));
  });
});
