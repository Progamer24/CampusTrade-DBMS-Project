export const databaseName = process.env.MONGODB_DATABASE || "campustrade";

export const listingValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["postgresItemId", "title", "description", "category", "condition", "status", "createdAt"],
    properties: {
      postgresItemId: { bsonType: "long", minimum: 1 },
      title: { bsonType: "string", minLength: 1, maxLength: 160 },
      description: { bsonType: "string", minLength: 1, maxLength: 4000 },
      category: { bsonType: "string", minLength: 1, maxLength: 60 },
      condition: { enum: ["Like New", "Good", "Fair"] },
      status: { enum: ["Draft", "Pending", "Approved", "Rejected", "Active", "Sold", "Removed"] },
      sellerId: { bsonType: "long", minimum: 1 },
      attributes: { bsonType: "object" },
      imageMetadata: { bsonType: "array", maxItems: 10 },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

export const reviewValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["postgresItemId", "reviewerId", "rating", "reviewText", "createdAt"],
    properties: {
      postgresItemId: { bsonType: "long", minimum: 1 },
      reviewerId: { bsonType: "long", minimum: 1 },
      rating: { bsonType: "int", minimum: 1, maximum: 5 },
      reviewText: { bsonType: "string", minLength: 1, maxLength: 2000 },
      createdAt: { bsonType: "date" },
    },
  },
};

export async function configureMongoDatabase(db) {
  await ensureCollection(db, "listings", listingValidator);
  await ensureCollection(db, "reviews", reviewValidator);

  await db.collection("listings").createIndex({ postgresItemId: 1 }, { unique: true, name: "listings_postgres_item_unique" });
  await db.collection("listings").createIndex({ status: 1, category: 1 }, { name: "listings_status_category_idx" });
  await db.collection("listings").createIndex({ title: "text", description: "text" }, { name: "listings_text_idx" });
  await db.collection("reviews").createIndex({ postgresItemId: 1, createdAt: -1 }, { name: "reviews_item_created_idx" });
  await db.collection("reviews").createIndex({ postgresItemId: 1, reviewerId: 1 }, { unique: true, name: "reviews_item_reviewer_unique" });
}

async function ensureCollection(db, name, validator) {
  try {
    await db.createCollection(name, { validator, validationLevel: "strict", validationAction: "error" });
  } catch (error) {
    if (error.codeName !== "NamespaceExists") throw error;
    await db.command({ collMod: name, validator, validationLevel: "strict", validationAction: "error" });
  }
}