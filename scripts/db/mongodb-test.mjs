import { Long, MongoClient } from "mongodb";
import { configureMongoDatabase, databaseName } from "../../database/mongodb/setup.mjs";

if (!process.env.MONGODB_URI) {
  console.error("BLOCKED: MONGODB_URI is not set.");
  process.exit(2);
}

const client = new MongoClient(process.env.MONGODB_URI);
const testIdBase = Date.now() * 1000 + (process.pid % 1000);
const testItemId = Long.fromNumber(testIdBase);
const testReviewerId = Long.fromNumber(testIdBase + 1);
let db;
try {
  await client.connect();
  db = client.db(databaseName);
  await configureMongoDatabase(db);
  const listingIndexes = await db.collection("listings").listIndexes().toArray();
  const reviewIndexes = await db.collection("reviews").listIndexes().toArray();
  const indexNames = [...listingIndexes, ...reviewIndexes].map((index) => index.name);
  for (const expected of ["listings_postgres_item_unique", "listings_text_idx", "reviews_item_reviewer_unique"]) {
    if (!indexNames.includes(expected)) throw new Error(`missing index ${expected}`);
  }
  console.log("PASS: MongoDB required indexes exist.");

  try {
    await db.collection("listings").insertOne({ postgresItemId: Long.fromNumber(999999), title: "Invalid", status: "Active" });
    throw new Error("schema validation unexpectedly accepted an invalid listing");
  } catch (error) {
    if (error.message === "schema validation unexpectedly accepted an invalid listing" || error.code !== 121) throw error;
    console.log("PASS: MongoDB schema validation rejected an invalid listing.");
  }

  await db.collection("listings").insertOne({ postgresItemId: testItemId, sellerId: testReviewerId, title: "Verification listing", description: "Temporary verification document.", category: "Books", condition: "Good", status: "Active", attributes: {}, imageMetadata: [], createdAt: new Date(), updatedAt: new Date() });
  await db.collection("reviews").insertOne({ postgresItemId: testItemId, reviewerId: testReviewerId, rating: 5, reviewText: "Temporary verification review.", createdAt: new Date() });
  try {
    await db.collection("reviews").insertOne({ postgresItemId: testItemId, reviewerId: testReviewerId, rating: 5, reviewText: "Duplicate", createdAt: new Date() });
    throw new Error("duplicate review unexpectedly succeeded");
  } catch (error) {
    if (error.message === "duplicate review unexpectedly succeeded" || error.code !== 11000) throw error;
    console.log(`PASS: MongoDB duplicate review was rejected (${error.code || "unique index"}).`);
  }
  await db.collection("reviews").deleteOne({ postgresItemId: testItemId, reviewerId: testReviewerId });
  await db.collection("listings").deleteOne({ postgresItemId: testItemId });
} catch (error) {
  console.error(`BLOCKED: MongoDB verification could not execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  await db?.collection("reviews").deleteOne({ postgresItemId: testItemId, reviewerId: testReviewerId }).catch(() => undefined);
  await db?.collection("listings").deleteOne({ postgresItemId: testItemId }).catch(() => undefined);
  await client.close().catch(() => undefined);
}