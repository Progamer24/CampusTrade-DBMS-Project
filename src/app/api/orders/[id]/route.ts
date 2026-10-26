import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to view orders.");
  const { id } = await params;
  if (!/^\d+$/.test(id)) return jsonError(400, "INVALID_ID", "Invalid order identifier.");
  const order = await query("SELECT order_id, buyer_id, buyer_name, status, total_amount, item_count, created_at FROM order_summary WHERE order_id = $1 AND buyer_id = $2", [id, user.id]);
  if (!order.rows[0]) return jsonError(404, "NOT_FOUND", "Order not found.");
  const items = await query("SELECT oi.item_id, oi.unit_price, i.category, i.status FROM order_items oi JOIN items i ON i.id = oi.item_id WHERE oi.order_id = $1", [id]);
  const payments = await query("SELECT provider, status, amount, created_at FROM payment_logs WHERE order_id = $1 ORDER BY created_at DESC", [id]);
  return NextResponse.json({ order: order.rows[0], items: items.rows, payments: payments.rows });
}