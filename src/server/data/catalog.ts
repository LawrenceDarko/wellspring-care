import "server-only";
import type { Db, ObjectId } from "mongodb";
import { getDb } from "../db";
import type { Channel, DepositRule, Service, ServiceCategory, ServicePackage } from "./schemas/catalog";

// Public catalog read (PRD §3.2, §5.2). Everything returned here is shown on
// the public site, so no AuthContext is needed. Only active categories,
// services in active categories, and active packages are ever returned.
// Admin catalog writes (audit logged, new Stripe Price per edit) come later.

export type PublicCategory = { id: string; slug: string; name: string; summary: string };
export type PublicService = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  bodyRef?: string;
  eligibility?: string;
  intakeFormKey: string;
  category: { slug: string; name: string };
  /** Lowest active package price; absent when the service has no active package. */
  startingPrice?: Money;
};
export type Money = { cents: number; currency: string };
export type PublicPackage = {
  id: string;
  slug: string;
  name: string;
  sessionCount: number;
  minutesPerSession: number;
  durationWeeks: number;
  channels: Channel[];
  responseTimeText: string;
  includedItems: string[];
  priceCents: number;
  currency: string;
  depositRule: DepositRule;
  installmentsAllowed: boolean;
};
export type PublicServiceDetail = PublicService & { packages: PublicPackage[] };

/** Cheapest of the given packages (prices are per package, in its own currency). */
export function startingPrice(packages: { priceCents: number; currency: string }[]): Money | undefined {
  let min: Money | undefined;
  for (const p of packages) if (!min || p.priceCents < min.cents) min = { cents: p.priceCents, currency: p.currency };
  return min;
}

const byOrder = { order: 1, name: 1 } as const;

async function activeCategories(db: Db) {
  return db
    .collection<ServiceCategory>("service_categories")
    .find({ active: true }, { projection: { slug: 1, name: 1, summary: 1 } })
    .sort(byOrder)
    .toArray();
}

function toPublicService(s: Service & { _id: ObjectId }, c: { slug: string; name: string }): PublicService {
  return {
    id: s._id.toHexString(),
    slug: s.slug,
    name: s.name,
    summary: s.summary,
    ...(s.bodyRef ? { bodyRef: s.bodyRef } : {}),
    ...(s.eligibility ? { eligibility: s.eligibility } : {}),
    intakeFormKey: s.intakeFormKey,
    category: { slug: c.slug, name: c.name },
  };
}

/** Active categories in display order. */
export async function listCategories(db?: Db): Promise<PublicCategory[]> {
  const cats = await activeCategories(db ?? (await getDb()));
  return cats.map((c) => ({ id: c._id.toHexString(), slug: c.slug, name: c.name, summary: c.summary }));
}

/** Active services whose category is active, optionally filtered by category slug. */
export async function listServices(opts: { categorySlug?: string } = {}, db?: Db): Promise<PublicService[]> {
  const database = db ?? (await getDb());
  const cats = (await activeCategories(database)).filter(
    (c) => !opts.categorySlug || c.slug === opts.categorySlug,
  );
  if (cats.length === 0) return [];
  const catById = new Map(cats.map((c) => [c._id.toHexString(), c]));
  const services = await database
    .collection<Service>("services")
    .find({ active: true, categoryId: { $in: cats.map((c) => c._id) } })
    .sort(byOrder)
    .toArray();
  const packages = await database
    .collection<ServicePackage>("service_packages")
    .find(
      { active: true, serviceId: { $in: services.map((s) => s._id) } },
      { projection: { serviceId: 1, priceCents: 1, currency: 1 } },
    )
    .toArray();
  const pkgsByService = Map.groupBy(packages, (p) => p.serviceId.toHexString());
  const catOrder = new Map(cats.map((c, i) => [c._id.toHexString(), i]));
  return services
    .sort((a, b) => catOrder.get(a.categoryId.toHexString())! - catOrder.get(b.categoryId.toHexString())!)
    .map((s) => {
      const from = startingPrice(pkgsByService.get(s._id.toHexString()) ?? []);
      return { ...toPublicService(s, catById.get(s.categoryId.toHexString())!), ...(from ? { startingPrice: from } : {}) };
    });
}

/** One active service with its active packages; null when missing or inactive. */
export async function getServiceBySlug(slug: string, db?: Db): Promise<PublicServiceDetail | null> {
  const database = db ?? (await getDb());
  const service = await database.collection<Service>("services").findOne({ slug, active: true });
  if (!service) return null;
  const category = await database
    .collection<ServiceCategory>("service_categories")
    .findOne({ _id: service.categoryId, active: true });
  if (!category) return null;
  const packages = await database
    .collection<ServicePackage>("service_packages")
    .find({ serviceId: service._id, active: true })
    .sort(byOrder)
    .toArray();
  const from = startingPrice(packages);
  return {
    ...toPublicService(service, category),
    ...(from ? { startingPrice: from } : {}),
    packages: packages.map((p) => ({
      id: p._id.toHexString(),
      slug: p.slug,
      name: p.name,
      sessionCount: p.sessionCount,
      minutesPerSession: p.minutesPerSession,
      durationWeeks: p.durationWeeks,
      channels: p.channels,
      responseTimeText: p.responseTimeText,
      includedItems: p.includedItems,
      priceCents: p.priceCents,
      currency: p.currency,
      depositRule: p.depositRule,
      installmentsAllowed: p.installmentsAllowed,
    })),
  };
}
