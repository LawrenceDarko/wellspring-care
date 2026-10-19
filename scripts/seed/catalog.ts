import type { Db, ObjectId } from "mongodb";
import type { Channel, DepositRule } from "../../src/server/data/schemas/catalog.ts";

// Fictional dev catalog (PRD §5.2, §8). Idempotent: upserts by slug and only
// inserts missing docs ($setOnInsert), so re-running never overwrites admin
// edits. Packages are inserted `active: false` (unreviewed prices); the dev
// flag `activatePackages` sets them active so the public site has data.
// Relative imports only (loaded by Node type stripping).

type PackageSeed = {
  slug: string;
  name: string;
  sessionCount: number;
  minutesPerSession?: number;
  durationWeeks: number;
  priceCents: number;
  includedItems?: string[];
};
type ServiceSeed = {
  slug: string;
  name: string;
  summary: string;
  eligibility?: string;
  intakeFormKey: string;
  channels: Channel[];
  responseTimeText?: string;
  packages: PackageSeed[];
};
type CategorySeed = { slug: string; name: string; summary: string; services: ServiceSeed[] };

const REMOTE: Channel[] = ["in_person", "video", "phone"];
const NOT_THERAPY = "Pastoral care from a faith perspective. Not licensed mental-health therapy or medical care.";

const single = (priceCents = 8000, minutesPerSession = 60): PackageSeed => ({
  slug: "single-session",
  name: "Single session",
  sessionCount: 1,
  minutesPerSession,
  durationWeeks: 1,
  priceCents,
});
const series = (sessions: number, weeks: number, priceCents: number): PackageSeed => ({
  slug: `${sessions}-sessions`,
  name: `${sessions} sessions over ${weeks} weeks`,
  sessionCount: sessions,
  durationWeeks: weeks,
  priceCents,
  includedItems: ["Prayer and Scripture suggestions between sessions"],
});

export const CATALOG_SEED: CategorySeed[] = [
  {
    slug: "spiritual-care",
    name: "Spiritual care",
    summary: "Personal spiritual support, direction and prayer for any season of life.",
    services: [
      { slug: "general-spiritual-support", name: "General spiritual support", summary: "A listening, prayerful conversation about whatever you are carrying.", intakeFormKey: "general-care", channels: REMOTE, packages: [single()] },
      { slug: "spiritual-direction", name: "Spiritual direction", summary: "Unhurried companionship in noticing God's presence in daily life.", intakeFormKey: "general-care", channels: REMOTE, packages: [single(), series(6, 24, 42000)] },
      { slug: "faith-questions", name: "Faith questions", summary: "Space to explore doubts and questions about faith without judgment.", intakeFormKey: "general-care", channels: REMOTE, packages: [single()] },
      { slug: "prayer-and-scripture", name: "Prayer and Scripture encouragement", summary: "Prayer together and Scripture chosen for your situation.", intakeFormKey: "general-care", channels: REMOTE, packages: [single(6000, 30)] },
      { slug: "ongoing-monthly-support", name: "Ongoing monthly support", summary: "Regular pastoral check-ins for steady accompaniment over time.", intakeFormKey: "general-care", channels: REMOTE, packages: [series(4, 4, 30000)] },
      { slug: "individual-pastoral-counseling", name: "Individual pastoral counseling", summary: "Faith-centered guidance for personal struggles and decisions.", eligibility: NOT_THERAPY, intakeFormKey: "general-care", channels: REMOTE, packages: [single(9000), series(4, 4, 32000)] },
    ],
  },
  {
    slug: "chaplaincy",
    name: "Chaplaincy",
    summary: "Chaplain visits in hospitals, hospice and care settings, and support for caregivers.",
    services: [
      { slug: "hospital-chaplaincy", name: "Hospital chaplaincy", summary: "Prayer and presence for patients and families during a hospital stay.", eligibility: "Complements the hospital's care team and its own chaplaincy service.", intakeFormKey: "general-care", channels: ["in_person", "phone"], packages: [single()] },
      { slug: "hospice-end-of-life", name: "Hospice and end-of-life care", summary: "Spiritual care for the person who is dying and those who love them.", eligibility: "Complements the hospice clinical team; it does not replace it.", intakeFormKey: "hospice", channels: REMOTE, packages: [single(), series(4, 4, 30000)] },
      { slug: "caregiver-support", name: "Caregiver support", summary: "Encouragement and rest for those caring for a loved one.", intakeFormKey: "general-care", channels: REMOTE, packages: [single(), series(4, 8, 30000)] },
    ],
  },
  {
    slug: "grief-and-hard-times",
    name: "Grief and hard times",
    summary: "Gentle pastoral support through loss and difficult events.",
    services: [
      { slug: "grief-and-bereavement", name: "Grief and bereavement", summary: "Walking with you after the loss of someone you love.", intakeFormKey: "general-care", channels: REMOTE, packages: [single(), series(4, 4, 30000), series(8, 8, 56000)] },
      { slug: "crisis-pastoral-support", name: "Crisis-related pastoral support", summary: "Prayerful support in the days after a hard event.", eligibility: "Not an emergency or crisis service. If you are in danger, call 911, or call or text 988.", intakeFormKey: "general-care", channels: REMOTE, responseTimeText: "We aim to reply within 1 business day. Not an emergency service.", packages: [single()] },
    ],
  },
  {
    slug: "marriage-and-family",
    name: "Marriage and family",
    summary: "Faith-centered preparation and support for couples, parents and families.",
    services: [
      { slug: "family-spiritual-care", name: "Family spiritual care", summary: "Prayer and guidance for the whole family together.", intakeFormKey: "family-couples", channels: REMOTE, packages: [single(9000, 75)] },
      { slug: "premarital", name: "Premarital preparation", summary: "Preparing for a faith-centered marriage together.", eligibility: NOT_THERAPY, intakeFormKey: "family-couples", channels: ["in_person", "video"], packages: [series(4, 4, 32000), series(6, 6, 46000), series(8, 8, 60000), series(12, 12, 86000)] },
      { slug: "marriage-enrichment", name: "Marriage enrichment", summary: "Strengthening friendship, communication and faith as a couple.", eligibility: NOT_THERAPY, intakeFormKey: "family-couples", channels: ["in_person", "video"], packages: [single(9000, 75), series(6, 6, 46000)] },
      { slug: "parenting-and-family", name: "Parenting and family", summary: "Biblical encouragement for parents in every stage.", intakeFormKey: "family-couples", channels: REMOTE, packages: [single(), series(4, 4, 30000)] },
      { slug: "singles-and-relationships", name: "Singles and relationship formation", summary: "Discernment and encouragement for single adults and new relationships.", intakeFormKey: "general-care", channels: REMOTE, packages: [single()] },
    ],
  },
  {
    slug: "ministry-and-leadership",
    name: "Ministry and leadership",
    summary: "Care, mentoring and restoration for pastors, leaders and those hurt in church.",
    services: [
      { slug: "ministry-burnout", name: "Ministry burnout care", summary: "Rest and renewal for those worn out by ministry.", eligibility: NOT_THERAPY, intakeFormKey: "general-care", channels: REMOTE, packages: [single(), series(4, 8, 30000)] },
      { slug: "ministry-leadership", name: "Ministry leadership", summary: "Pastoral perspective on leading with integrity and health.", intakeFormKey: "general-care", channels: ["video", "phone"], packages: [single()] },
      { slug: "mentorship", name: "Mentorship", summary: "Ongoing mentoring in faith, calling and character.", intakeFormKey: "general-care", channels: ["video", "phone"], packages: [series(6, 12, 42000)] },
      { slug: "church-hurt", name: "Church hurt", summary: "A safe place to name and heal from harm experienced in church.", intakeFormKey: "general-care", channels: REMOTE, packages: [single(), series(4, 8, 30000)] },
    ],
  },
];

function depositFor(p: PackageSeed): DepositRule {
  return p.sessionCount > 1 ? { type: "percent", percent: 25 } : { type: "none" };
}

export type SeedCatalogResult = { categories: number; services: number; packages: number; inserted: number };

/** Upserts the fictional catalog. Never overwrites existing docs; `activatePackages` is dev only. */
export async function seedCatalog(
  db: Db,
  opts: { activatePackages?: boolean; now?: Date } = {},
): Promise<SeedCatalogResult> {
  const now = opts.now ?? new Date();
  const result: SeedCatalogResult = { categories: 0, services: 0, packages: 0, inserted: 0 };

  const upsert = async (collection: string, filter: Record<string, unknown>, doc: Record<string, unknown>, set?: Record<string, unknown>) => {
    const res = await db.collection(collection).findOneAndUpdate(
      filter,
      {
        $setOnInsert: { ...filter, ...doc, createdAt: now },
        ...(set ? { $set: { ...set, updatedAt: now } } : {}),
      },
      { upsert: true, returnDocument: "after", includeResultMetadata: true },
    );
    if (res.lastErrorObject?.upserted) result.inserted++;
    return res.value!._id as ObjectId;
  };

  for (const [ci, cat] of CATALOG_SEED.entries()) {
    const categoryId = await upsert("service_categories", { slug: cat.slug }, {
      name: cat.name, summary: cat.summary, order: ci, active: true, updatedAt: now,
    });
    result.categories++;
    for (const [si, svc] of cat.services.entries()) {
      const serviceId = await upsert("services", { slug: svc.slug }, {
        categoryId, name: svc.name, summary: svc.summary, intakeFormKey: svc.intakeFormKey, order: si, active: true, updatedAt: now,
        ...(svc.eligibility ? { eligibility: svc.eligibility } : {}),
      });
      result.services++;
      for (const [pi, pkg] of svc.packages.entries()) {
        const fields = {
          name: pkg.name,
          sessionCount: pkg.sessionCount,
          minutesPerSession: pkg.minutesPerSession ?? 60,
          durationWeeks: pkg.durationWeeks,
          channels: svc.channels,
          responseTimeText: svc.responseTimeText ?? "We aim to reply within 2 business days.",
          includedItems: pkg.includedItems ?? [],
          priceCents: pkg.priceCents,
          currency: "USD",
          depositRule: depositFor(pkg),
          installmentsAllowed: pkg.sessionCount >= 6,
          order: pi,
        };
        // `active` is in $setOnInsert unless the dev flag forces it on, so a
        // re-run never deactivates a package an admin has reviewed.
        await upsert(
          "service_packages",
          { serviceId, slug: pkg.slug },
          opts.activatePackages ? fields : { ...fields, active: false, updatedAt: now },
          opts.activatePackages ? { active: true } : undefined,
        );
        result.packages++;
      }
    }
  }
  return result;
}
