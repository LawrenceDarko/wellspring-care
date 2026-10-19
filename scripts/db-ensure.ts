// Applies MongoDB validators + indexes from the registry. Idempotent.
// Run: npm run db:ensure (loads .env.local if present).
// Reads only MONGODB_URI / MONGODB_DB so it can run without the app's other secrets.
import { MongoClient } from "mongodb";
import { collections, ensureCollections } from "../src/server/data/registry.ts";

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB?.trim() || "wellspring";

if (!uri || !/^mongodb(\+srv)?:\/\//.test(uri)) {
  console.error("db:ensure: MONGODB_URI is missing or not a mongodb:// URI.");
  process.exit(1);
}

const client = new MongoClient(uri, { appName: "wellspring-care-ensure" });
try {
  await client.connect();
  await ensureCollections(client.db(dbName));
  console.log(`db:ensure: ${collections.length} collections ensured in "${dbName}".`);
} catch (err) {
  // Error name/message only; the driver never includes credentials in these.
  console.error("db:ensure failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
  process.exitCode = 1;
} finally {
  await client.close();
}
