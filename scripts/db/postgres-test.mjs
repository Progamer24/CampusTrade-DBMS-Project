import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error("BLOCKED: DATABASE_URL is not set.");
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const expectedTables = ["users", "items", "orders", "order_items", "payment_logs"];
const expectedIndexes = ["users_email_lower_unique", "items_status_category_idx", "orders_buyer_status_idx", "order_items_item_sold_once_unique", "payment_logs_order_id_idx"];

async function mustReject(client, sql, params, label) {
  await client.query("SAVEPOINT constraint_test");
  try {
    await client.query(sql, params);
    throw new Error(`${label} unexpectedly succeeded`);
  } catch (error) {
    if (error.message === `${label} unexpectedly succeeded`) throw error;
    console.log(`PASS: ${label} rejected (${error.code || "constraint"}).`);
  } finally {
    await client.query("ROLLBACK TO SAVEPOINT constraint_test");
  }
}

try {
  const client = await pool.connect();
  try {
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)", [expectedTables]);
    if (tables.rowCount !== expectedTables.length) throw new Error(`expected ${expectedTables.length} tables, found ${tables.rowCount}`);
    console.log("PASS: PostgreSQL required tables exist.");

    const indexes = await client.query("SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY($1)", [expectedIndexes]);
    if (indexes.rowCount !== expectedIndexes.length) throw new Error(`expected ${expectedIndexes.length} indexes, found ${indexes.rowCount}`);
    console.log("PASS: PostgreSQL required indexes exist.");

    await client.query("BEGIN");
    await mustReject(client, "INSERT INTO users (full_name, email) VALUES ($1, $2)", ["Duplicate", "aarav.sharma@campus.edu"], "duplicate user email");
    await mustReject(client, "INSERT INTO items (seller_id, category, price) VALUES ($1, $2, $3)", [1, "Books", -1], "negative item price");
    await mustReject(client, "INSERT INTO items (seller_id, category, price) VALUES ($1, $2, $3)", [999999, "Books", 10], "unknown seller foreign key");
    await client.query("ROLLBACK");
    console.log("PASS: PostgreSQL invalid and duplicate writes were rejected without persistent changes.");
  } finally {
    client.release();
  }
} catch (error) {
  console.error(`BLOCKED: PostgreSQL verification could not execute: ${error.message}`);
  process.exitCode = 2;
} finally {
  await pool.end();
}