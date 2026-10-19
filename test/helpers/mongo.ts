import { MongoClient, type Db } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// In-memory replica set (PRD §3.1: transactions need a replica set).
// Usage: const mongo = await startMongo(); ... await mongo.stop();
export type TestMongo = { uri: string; client: MongoClient; db: Db; stop: () => Promise<void> };

export async function startMongo(dbName = "wellspring_test"): Promise<TestMongo> {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const uri = replSet.getUri();
  const client = await new MongoClient(uri).connect();
  return {
    uri,
    client,
    db: client.db(dbName),
    stop: async () => {
      await client.close();
      await replSet.stop();
    },
  };
}
