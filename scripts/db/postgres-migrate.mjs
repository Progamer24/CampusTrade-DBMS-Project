import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

if (!process.env.DATABASE_URL) {
  console.error("BLOCKED: DATABASE_URL is not set. Copy .env.example to .env.local and configure PostgreSQL.");
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const migrationDirectory = join(root, "database/postgres/migrations");
  const migrationFiles = (await readdir(migrationDirectory))
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();
  const client = await pool.connect();
  try {
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    for (const migrationFile of migrationFiles) {
      const migrationName = migrationFile.replace(/\.sql$/, "");
      const result = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [migrationName]);
      if (result.rowCount === 0) {
        const migration = await readFile(join(migrationDirectory, migrationFile), "utf8");
      await client.query("BEGIN");
      await client.query(migration);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migrationName]);
      await client.query("COMMIT");
        console.log(`PASS: PostgreSQL migration ${migrationName} applied.`);
      } else {
        console.log(`PASS: PostgreSQL migration ${migrationName} already applied; no changes needed.`);
      }
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(`BLOCKED: PostgreSQL migration could not connect or execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  await pool.end();
}