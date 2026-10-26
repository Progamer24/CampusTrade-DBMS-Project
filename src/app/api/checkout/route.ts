import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { pool } from "@/lib/server/db";
import { mongoDb, postgresId } from "@/lib/server/mongodb";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to checkout.");
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return jsonError(400, "INVALID_JSON", "Invalid request body."); }
  const itemId = typeof input.itemId === "string" || typeof input.itemId === "number" ? String(input.itemId) : "";
  const checkoutKey = typeof input.checkoutKey === "string" ? input.checkoutKey.trim() : "";
  const simulateFailure = input.simulateFailure === true;
  if (!/^\d+$/.test(itemId) || !/^[A-Za-z0-9._:-]{8,120}$/.test(checkoutKey)) return jsonError(400, "VALIDATION_ERROR", "A valid item ID and checkout key are required.");

  const client = await pool.connect();
  let committedOrderId: string | undefined;
  let committedItemId: string | undefined;
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id: string; buyer_id: string; status: string }>("SELECT id, buyer_id, status FROM orders WHERE checkout_key = $1 FOR UPDATE", [checkoutKey]);
    if (existing.rows[0]) {
      if (existing.rows[0].buyer_id !== user.id) { await client.query("ROLLBACK"); return jsonError(409, "CHECKOUT_KEY_IN_USE", "That checkout request cannot be reused."); }
      await client.query("COMMIT");
      return NextResponse.json({ orderId: existing.rows[0].id, status: existing.rows[0].status, idempotent: true });
    }
    const item = await client.query<{ id: string; price: string; status: string }>("SELECT id, price, status FROM items WHERE id = $1 FOR UPDATE", [itemId]);
    if (!item.rows[0]) { await client.query("ROLLBACK"); return jsonError(404, "ITEM_NOT_FOUND", "Listing not found."); }
    if (item.rows[0].status !== "Available") { await client.query("ROLLBACK"); return jsonError(409, "ITEM_UNAVAILABLE", "This listing is no longer available."); }
    const order = await client.query<{ id: string }>("INSERT INTO orders (buyer_id, status, total_amount, checkout_key) VALUES ($1, 'Pending', $2, $3) RETURNING id", [user.id, item.rows[0].price, checkoutKey]);
    committedOrderId = order.rows[0].id;
    committedItemId = item.rows[0].id;
    await client.query("INSERT INTO order_items (order_id, item_id, unit_price) VALUES ($1, $2, $3)", [committedOrderId, committedItemId, item.rows[0].price]);
    const paymentStatus = simulateFailure ? "Failed" : "Succeeded";
    await client.query("INSERT INTO payment_logs (order_id, provider, provider_reference, status, amount) VALUES ($1, 'simulated', $2, $3, $4)", [committedOrderId, `simulated-${checkoutKey}`, paymentStatus, item.rows[0].price]);
    await client.query("UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [simulateFailure ? "Failed" : "Completed", committedOrderId]);
    await client.query("COMMIT");

    let syncWarning = false;
    try { await (await mongoDb()).collection("listings").updateOne({ postgresItemId: postgresId(committedItemId) }, { $set: { status: simulateFailure ? "Active" : "Sold", updatedAt: new Date() } }); }
    catch { syncWarning = true; console.error("MongoDB listing status reconciliation is required."); }
    return NextResponse.json({ orderId: committedOrderId, status: simulateFailure ? "Failed" : "Completed", paymentStatus, syncWarning }, { status: simulateFailure ? 402 : 201 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return jsonError(409, "CHECKOUT_RETRY", "That checkout request has already been processed.");
    console.error("Checkout transaction failed.");
    return jsonError(503, "CHECKOUT_FAILED", "Checkout could not be completed.");
  } finally { client.release(); }
}