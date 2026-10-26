import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

if (!process.env.DATABASE_URL) {
  console.error("BLOCKED: DATABASE_URL is not set.");
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  const seed = await readFile(join(root, "database/postgres/seed.sql"), "utf8");
  await client.query("BEGIN");
  await client.query(seed);
  await client.query("COMMIT");
  console.log("PASS: PostgreSQL development seed data loaded.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(`BLOCKED: PostgreSQL seed could not execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  client.release();
  await pool.end();
}