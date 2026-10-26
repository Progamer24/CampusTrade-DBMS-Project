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
try {
  const seed = await readFile(join(root, "database/postgres/seed.sql"), "utf8");
  await pool.query("BEGIN");
  await pool.query(seed);
  await pool.query("COMMIT");
  console.log("PASS: PostgreSQL development seed data loaded.");
} catch (error) {
  await pool.query("ROLLBACK").catch(() => undefined);
  console.error(`BLOCKED: PostgreSQL seed could not execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  await pool.end();
}