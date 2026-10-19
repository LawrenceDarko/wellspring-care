// Seeds fictional dev data. Idempotent: inserts missing docs only.
// Run: npm run db:seed (loads .env.local if present). Run db:ensure first.
// `--activate-packages` (dev only) marks seeded packages active so the public
// site shows prices; refused when NODE_ENV=production (prices need review, PRD §8).
import { MongoClient } from "mongodb";
import { seedCatalog } from "./seed/catalog.ts";

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB?.trim() || "wellspring";
const activatePackages = process.argv.includes("--activate-packages");

if (!uri || !/^mongodb(\+srv)?:\/\//.test(uri)) {
  console.error("db:seed: MONGODB_URI is missing or not a mongodb:// URI.");
  process.exit(1);
}
if (activatePackages && process.env.NODE_ENV === "production") {
  console.error("db:seed: --activate-packages is not allowed in production.");
  process.exit(1);
}

const client = new MongoClient(uri, { appName: "wellspring-care-seed" });
try {
  await client.connect();
  const r = await seedCatalog(client.db(dbName), { activatePackages });
  console.log(
    `db:seed: catalog ${r.categories} categories, ${r.services} services, ${r.packages} packages ` +
      `(${r.inserted} new) in "${dbName}"${activatePackages ? ", packages active (dev)" : ", packages inactive"}.`,
  );
} catch (err) {
  console.error("db:seed failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
  process.exitCode = 1;
} finally {
  await client.close();
}
