import { Long, MongoClient } from "mongodb";
import { configureMongoDatabase, databaseName } from "../../database/mongodb/setup.mjs";

if (!process.env.MONGODB_URI) {
  console.error("BLOCKED: MONGODB_URI is not set.");
  process.exit(2);
}

const client = new MongoClient(process.env.MONGODB_URI);
const now = new Date();
try {
  await client.connect();
  const db = client.db(databaseName);
  await configureMongoDatabase(db);
  await db.collection("listings").bulkWrite([
    { updateOne: { filter: { postgresItemId: Long.fromNumber(1) }, update: { $set: { postgresItemId: Long.fromNumber(1), sellerId: Long.fromNumber(1), title: "Engineering Mathematics Textbook", description: "A well-kept reference copy.", category: "Books", condition: "Good", status: "Active", attributes: { edition: "2024" }, imageMetadata: [], createdAt: now, updatedAt: now } }, upsert: true } },
    { updateOne: { filter: { postgresItemId: Long.fromNumber(2) }, update: { $set: { postgresItemId: Long.fromNumber(2), sellerId: Long.fromNumber(1), title: "Scientific Calculator", description: "Reliable calculator for coursework.", category: "Electronics", condition: "Like New", status: "Active", attributes: { battery: "included" }, imageMetadata: [], createdAt: now, updatedAt: now } }, upsert: true } },
  ]);
  await db.collection("reviews").updateOne({ postgresItemId: Long.fromNumber(1), reviewerId: Long.fromNumber(2) }, { $set: { postgresItemId: Long.fromNumber(1), reviewerId: Long.fromNumber(2), rating: 5, reviewText: "Clear pages and exactly as described.", createdAt: now } }, { upsert: true });
  console.log("PASS: MongoDB development seed data loaded.");
} catch (error) {
  console.error(`BLOCKED: MongoDB seed could not execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  await client.close().catch(() => undefined);
}