import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as typeof globalThis & { campusTradePool?: Pool };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for server database access.");
}

export const pool = globalForDb.campusTradePool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

if (process.env.NODE_ENV !== "production") globalForDb.campusTradePool = pool;

export async function query<Row extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return pool.query<Row>(text, values);
}