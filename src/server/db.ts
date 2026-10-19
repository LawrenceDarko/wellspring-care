import "server-only";
import { MongoClient, type Db } from "mongodb";
import { getConfig } from "./config";

// One MongoClient per process. Cached on globalThis so dev HMR and warm
// serverless invocations reuse the pool instead of opening new connections.
// Only src/server/data/ repositories should call getDb() (CLAUDE.md invariants).

type MongoCache = { client?: MongoClient; connecting?: Promise<MongoClient> };

const globalForMongo = globalThis as typeof globalThis & { __wellspringMongo?: MongoCache };
const cache: MongoCache = (globalForMongo.__wellspringMongo ??= {});

export async function getClient(): Promise<MongoClient> {
  if (cache.client) return cache.client;
  if (!cache.connecting) {
    const { env } = getConfig();
    const client = new MongoClient(env.MONGODB_URI, { appName: "wellspring-care" });
    cache.connecting = client
      .connect()
      .then((c) => {
        cache.client = c;
        return c;
      })
      .catch((err: unknown) => {
        cache.connecting = undefined;
        throw err;
      });
  }
  return cache.connecting;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getConfig().env.MONGODB_DB);
}
