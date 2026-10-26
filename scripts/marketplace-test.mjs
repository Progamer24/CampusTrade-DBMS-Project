import { randomBytes } from "node:crypto";
import pg from "pg";
import { Long, MongoClient } from "mongodb";

const { Pool } = pg;
const baseUrl = process.env.AUTH_TEST_BASE_URL || "http://127.0.0.1:3000";
if (!process.env.DATABASE_URL || !process.env.MONGODB_URI) { console.error("BLOCKED: database environment is not configured."); process.exit(2); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const mongo = new MongoClient(process.env.MONGODB_URI);
const unique = randomBytes(8).toString("hex");
const sellerEmail = `market-seller-${unique}@campus.edu`;
const buyerEmail = `market-buyer-${unique}@campus.edu`;
const password = `${randomBytes(18).toString("base64url")}Aa1!`;
const createdItemIds = [];
const createdUserIds = [];

function assert(condition, message) { if (!condition) throw new Error(message); }
function cookieFrom(response) { const cookie = (response.headers.getSetCookie?.() ?? []).find((item) => item.startsWith("campustrade_session=")); assert(cookie, "missing session cookie"); return cookie.split(";", 1)[0]; }
async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, { ...options, redirect: "manual" }); }
async function register(email, fullName) { const response = await request("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, fullName, password }) }); assert(response.status === 201, `registration returned ${response.status}`); const body = await response.json(); createdUserIds.push(body.user.id); return cookieFrom(response); }
async function createListing(cookie, title) { const response = await request("/api/listings", { method: "POST", headers: { cookie: cookie, "content-type": "application/json" }, body: JSON.stringify({ title, description: "Integration test listing", category: "Books", condition: "Good", price: 125 }) }); assert(response.status === 201, `listing creation returned ${response.status}`); const body = await response.json(); createdItemIds.push(body.id); return body.id; }

try {
  const sellerCookie = await register(sellerEmail, "Marketplace Test Seller");
  const buyerCookie = await register(buyerEmail, "Marketplace Test Buyer");
  const itemId = await createListing(sellerCookie, "Integration test item");
  const listingResponse = await request(`/api/listings/${itemId}`);
  assert(listingResponse.status === 200, `listing detail returned ${listingResponse.status}`);
  const browseResponse = await request(`/api/listings?category=Books&q=Integration&limit=10`);
  assert(browseResponse.status === 200 && (await browseResponse.json()).listings.some((item) => item.id === itemId), "listing search did not return the created item");
  const forbiddenEdit = await request(`/api/listings/${itemId}`, { method: "PATCH", headers: { cookie: buyerCookie, "content-type": "application/json" }, body: JSON.stringify({ price: 999 }) });
  assert(forbiddenEdit.status === 403, `ownership edit returned ${forbiddenEdit.status}`);
  console.log("PASS: listing creation, browse/search, and ownership enforcement.");

  const checkoutKey = `market-${unique}-success`;
  const checkout = await request("/api/checkout", { method: "POST", headers: { cookie: buyerCookie, "content-type": "application/json" }, body: JSON.stringify({ itemId, checkoutKey }) });
  assert(checkout.status === 201, `checkout returned ${checkout.status}`);
  const order = await checkout.json();
  const retry = await request("/api/checkout", { method: "POST", headers: { cookie: buyerCookie, "content-type": "application/json" }, body: JSON.stringify({ itemId, checkoutKey }) });
  assert(retry.status === 200 && (await retry.json()).orderId === order.orderId, "checkout retry was not idempotent");
  const sold = await pool.query("SELECT status FROM items WHERE id = $1", [itemId]);
  assert(sold.rows[0]?.status === "Sold", "completed checkout did not mark item Sold");
  const buyerOrders = await request("/api/orders", { headers: { cookie: buyerCookie } });
  assert(buyerOrders.status === 200 && (await buyerOrders.json()).orders.some((item) => String(item.order_id) === String(order.orderId)), "buyer order history omitted the purchase");
  console.log("PASS: transactional checkout, trigger, idempotent retry, and private order history.");

  const failedItemId = await createListing(sellerCookie, "Failed payment item");
  const failed = await request("/api/checkout", { method: "POST", headers: { cookie: buyerCookie, "content-type": "application/json" }, body: JSON.stringify({ itemId: failedItemId, checkoutKey: `market-${unique}-failed`, simulateFailure: true }) });
  assert(failed.status === 402, `simulated payment failure returned ${failed.status}`);
  const available = await pool.query("SELECT status FROM items WHERE id = $1", [failedItemId]);
  assert(available.rows[0]?.status === "Available", "failed payment changed inventory availability");
  console.log("PASS: simulated payment failure preserves available inventory.");

  const raceItemId = await createListing(sellerCookie, "Concurrent checkout item");
  const raceResponses = await Promise.all(["race-a", "race-b"].map((key) => request("/api/checkout", { method: "POST", headers: { cookie: buyerCookie, "content-type": "application/json" }, body: JSON.stringify({ itemId: raceItemId, checkoutKey: `market-${unique}-${key}` }) })));
  const raceStatuses = raceResponses.map((response) => response.status).sort((a, b) => a - b);
  assert(raceStatuses[0] === 201 && raceStatuses[1] === 409, `concurrent checkout statuses were ${raceStatuses.join(",")}`);
  console.log("PASS: concurrent checkout attempts cannot sell one item twice.");

  await pool.query("UPDATE users SET role = 'Admin' WHERE id = $1", [createdUserIds[0]]);
  const analytics = await request("/api/admin/analytics", { headers: { cookie: sellerCookie } });
  assert(analytics.status === 200 && (await analytics.json()).overview, `admin analytics returned ${analytics.status}`);
  console.log("PASS: admin analytics authorization and database aggregation endpoint.");
} catch (error) {
  console.error(`FAIL: marketplace verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  try {
    await mongo.connect();
    const db = mongo.db(process.env.MONGODB_DATABASE || "campustrade");
    if (createdItemIds.length) await db.collection("listings").deleteMany({ postgresItemId: { $in: createdItemIds.map((id) => Long.fromString(String(id))) } });
  } catch { /* Cleanup is best effort; PostgreSQL deletion remains guarded below. */ }
  await pool.query("DELETE FROM payment_logs WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ANY($1::BIGINT[]))", [createdUserIds]).catch(() => undefined);
  await pool.query("DELETE FROM orders WHERE buyer_id = ANY($1::BIGINT[])", [createdUserIds]).catch(() => undefined);
  if (createdItemIds.length) await pool.query("DELETE FROM items WHERE id = ANY($1::BIGINT[])", [createdItemIds]).catch(() => undefined);
  if (createdUserIds.length) await pool.query("DELETE FROM users WHERE id = ANY($1::BIGINT[])", [createdUserIds]).catch(() => undefined);
  await mongo.close().catch(() => undefined);
  await pool.end();
}