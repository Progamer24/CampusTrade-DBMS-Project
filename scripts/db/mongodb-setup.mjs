import { MongoClient } from "mongodb";
import { configureMongoDatabase, databaseName } from "../../database/mongodb/setup.mjs";

if (!process.env.MONGODB_URI) {
  console.error("BLOCKED: MONGODB_URI is not set. Copy .env.example to .env.local and configure MongoDB.");
  process.exit(2);
}

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  await configureMongoDatabase(client.db(databaseName));
  console.log("PASS: MongoDB listings/reviews collections, validators, and indexes are configured.");
} catch (error) {
  console.error(`BLOCKED: MongoDB setup could not connect or execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  await client.close().catch(() => undefined);
}