import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getServiceBySlug, listCategories, listServices } from "@/server/data/catalog";
import { ensureCollections } from "@/server/data/registry";
import { servicePackageSchema, serviceSchema, serviceCategorySchema } from "@/server/data/schemas/catalog";
import { CATALOG_SEED, seedCatalog } from "../scripts/seed/catalog";
import { startMongo, type TestMongo } from "./helpers/mongo";

let mongo: TestMongo;
const counts = async () => ({
  categories: await mongo.db.collection("service_categories").countDocuments(),
  services: await mongo.db.collection("services").countDocuments(),
  packages: await mongo.db.collection("service_packages").countDocuments(),
});

beforeAll(async () => {
  mongo = await startMongo();
  await ensureCollections(mongo.db);
});
afterAll(async () => mongo.stop());
beforeEach(async () => {
  for (const c of ["service_categories", "services", "service_packages"]) {
    await mongo.db.collection(c).deleteMany({});
  }
});

describe("seedCatalog", () => {
  it("is idempotent and passes the DB validators", async () => {
    const first = await seedCatalog(mongo.db);
    const after1 = await counts();
    expect(first.inserted).toBe(after1.categories + after1.services + after1.packages);
    expect(after1.categories).toBe(CATALOG_SEED.length);
    expect(after1.services).toBe(20); // PRD §5.2 service types

    const second = await seedCatalog(mongo.db);
    expect(second.inserted).toBe(0);
    expect(await counts()).toEqual(after1);
  });

  it("inserts every package inactive and matches the zod schemas", async () => {
    await seedCatalog(mongo.db);
    const pkgs = await mongo.db.collection("service_packages").find().toArray();
    expect(pkgs.length).toBeGreaterThan(0);
    expect(pkgs.every((p) => p.active === false)).toBe(true);
    for (const p of pkgs) servicePackageSchema.parse(p);
    for (const s of await mongo.db.collection("services").find().toArray()) serviceSchema.parse(s);
    for (const c of await mongo.db.collection("service_categories").find().toArray()) serviceCategorySchema.parse(c);
  });

  it("does not overwrite admin edits on re-run", async () => {
    await seedCatalog(mongo.db);
    await mongo.db.collection("service_packages").updateMany({}, { $set: { active: true, priceCents: 7500 } });
    await seedCatalog(mongo.db);
    const pkgs = await mongo.db.collection("service_packages").find().toArray();
    expect(pkgs.every((p) => p.active === true && p.priceCents === 7500)).toBe(true);
  });

  it("activates packages only with the dev flag", async () => {
    await seedCatalog(mongo.db);
    await seedCatalog(mongo.db, { activatePackages: true });
    expect(await mongo.db.collection("service_packages").countDocuments({ active: false })).toBe(0);
  });
});

describe("public catalog read", () => {
  it("hides inactive packages", async () => {
    await seedCatalog(mongo.db);
    const detail = await getServiceBySlug("premarital", mongo.db);
    expect(detail?.name).toBe("Premarital preparation");
    expect(detail?.packages).toEqual([]);

    await mongo.db.collection("service_packages").updateOne(
      { serviceId: { $exists: true }, slug: "6-sessions", active: false },
      { $set: { active: true } },
    );
    const activeSlugs = (await mongo.db.collection("service_packages").find({ active: true }).toArray()).map((p) => p.slug);
    expect(activeSlugs).toEqual(["6-sessions"]);
    const all = await Promise.all(
      CATALOG_SEED.flatMap((c) => c.services).map((s) => getServiceBySlug(s.slug, mongo.db)),
    );
    const visible = all.flatMap((d) => d?.packages ?? []);
    expect(visible).toHaveLength(1);
    expect(visible[0]).not.toHaveProperty("active");
    expect(visible[0]).not.toHaveProperty("stripePriceId");
  });

  it("hides inactive services and services in inactive categories", async () => {
    await seedCatalog(mongo.db);
    await mongo.db.collection("services").updateOne({ slug: "faith-questions" }, { $set: { active: false } });
    await mongo.db.collection("service_categories").updateOne({ slug: "chaplaincy" }, { $set: { active: false } });

    const slugs = (await listServices({}, mongo.db)).map((s) => s.slug);
    expect(slugs).not.toContain("faith-questions");
    expect(slugs).not.toContain("hospice-end-of-life");
    expect(slugs).toContain("general-spiritual-support");
    expect(await getServiceBySlug("faith-questions", mongo.db)).toBeNull();
    expect(await getServiceBySlug("hospice-end-of-life", mongo.db)).toBeNull();
    expect((await listCategories(mongo.db)).map((c) => c.slug)).not.toContain("chaplaincy");
    expect(await listServices({ categorySlug: "chaplaincy" }, mongo.db)).toEqual([]);
  });

  it("lists services in category then service order, filtered by category", async () => {
    await seedCatalog(mongo.db);
    const all = await listServices({}, mongo.db);
    expect(all.map((s) => s.slug)).toEqual(CATALOG_SEED.flatMap((c) => c.services.map((s) => s.slug)));
    const family = await listServices({ categorySlug: "marriage-and-family" }, mongo.db);
    expect(family.every((s) => s.category.slug === "marriage-and-family")).toBe(true);
    expect(family).toHaveLength(5);
  });
});
