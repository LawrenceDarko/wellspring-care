// Hermetic e2e server (GATE only): in-memory replica set, registry applied,
// fictional catalog seeded with packages active, then `next dev` on E2E_PORT
// with throwaway secrets. Never touches .env.local's database.
// Run by playwright.config.ts `webServer`; stops Mongo when Next exits.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { ensureCollections } from "../../src/server/data/registry.ts";
import { seedCatalog } from "../../scripts/seed/catalog.ts";

const port = process.env.E2E_PORT ?? "3100";
const dbName = "wellspring_e2e";

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const uri = replSet.getUri();
const client = await new MongoClient(uri).connect();
await ensureCollections(client.db(dbName));
await seedCatalog(client.db(dbName), { activatePackages: true });
await client.close();

const next = spawn("npx", ["next", "dev", "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    E2E_DIST_DIR: ".next-e2e",
    APP_URL: `http://localhost:${port}`,
    MONGODB_URI: uri,
    MONGODB_DB: dbName,
    AUTH_SECRET: randomBytes(32).toString("base64"),
    FIELD_ENC_KEY: randomBytes(32).toString("base64"),
    // Force the dev outbox transport even if the shell has Resend keys.
    RESEND_API_KEY: "",
    EMAIL_FROM: "",
  },
});

const stop = async (code: number) => {
  await replSet.stop();
  process.exit(code);
};
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code) => void stop(code ?? 0));
