import { Long, MongoClient, type Db, type Filter } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & { campusTradeMongo?: MongoClient };

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required for server database access.");

const client = globalForMongo.campusTradeMongo ?? new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5_000,
});
if (process.env.NODE_ENV !== "production") globalForMongo.campusTradeMongo = client;

export const mongoDb = async (): Promise<Db> => {
  await client.connect();
  return client.db(process.env.MONGODB_DATABASE || "campustrade");
};

export function postgresId(value: string | number) {
  return Long.fromString(String(value));
}

export function listingFilter(input: { query?: string; category?: string; condition?: string }) {
  const filter: Filter<unknown> = {};
  if (input.query) filter.$text = { $search: input.query };
  if (input.category) filter.category = input.category;
  if (input.condition) filter.condition = input.condition;
  return filter;
}

export function publicListingMetadata(document: Record<string, unknown> | null) {
  if (!document) return null;
  return {
    title: document.title,
    description: document.description,
    category: document.category,
    condition: document.condition,
    attributes: document.attributes || {},
    imageMetadata: document.imageMetadata || [],
    status: document.status,
  };
}