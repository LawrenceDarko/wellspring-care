import "server-only";
import type { Db } from "mongodb";
import { getDb } from "../db";
import type { EventListing, Testimonial } from "./schemas/content";

// Public content read (PRD §3.2, §4.3). Everything returned is shown on the
// public site, so no AuthContext is needed. Admin writes come later.

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startsAt: Date;
  endsAt?: Date;
  locationText: string;
};
export type PublicTestimonial = { id: string; quote: string; attribution: string };

/** Published events that have not ended yet, soonest first. */
export async function listUpcomingEvents(
  opts: { limit?: number; now?: Date } = {},
  db?: Db,
): Promise<PublicEvent[]> {
  const database = db ?? (await getDb());
  const now = opts.now ?? new Date();
  const events = await database
    .collection<EventListing>("events")
    .find({
      published: true,
      $or: [{ endsAt: { $gte: now } }, { endsAt: { $exists: false }, startsAt: { $gte: now } }],
    })
    .sort({ startsAt: 1 })
    .limit(opts.limit ?? 3)
    .toArray();
  return events.map((e) => ({
    id: e._id.toHexString(),
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    startsAt: e.startsAt,
    ...(e.endsAt ? { endsAt: e.endsAt } : {}),
    locationText: e.locationText,
  }));
}

/**
 * Published testimonials whose consent record exists, is granted and is not
 * revoked. A revoked consent hides the testimonial immediately.
 */
export async function listPublishedTestimonials(
  opts: { limit?: number } = {},
  db?: Db,
): Promise<PublicTestimonial[]> {
  const database = db ?? (await getDb());
  const candidates = await database
    .collection<Testimonial>("testimonials")
    .find({ published: true, consentRecordId: { $exists: true } })
    .sort({ order: 1, createdAt: -1 })
    .toArray();
  if (candidates.length === 0) return [];
  const granted = await database
    .collection("consent_records")
    .find(
      { _id: { $in: candidates.map((t) => t.consentRecordId!) }, granted: true, revokedAt: null },
      { projection: { _id: 1 } },
    )
    .toArray();
  const ok = new Set(granted.map((c) => c._id.toHexString()));
  return candidates
    .filter((t) => ok.has(t.consentRecordId!.toHexString()))
    .slice(0, opts.limit ?? 3)
    .map((t) => ({ id: t._id.toHexString(), quote: t.quote, attribution: t.attribution }));
}
