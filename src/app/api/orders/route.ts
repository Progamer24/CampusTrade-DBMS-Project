import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to view orders.");
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 20), 1), 50);
  const result = await query("SELECT order_id, buyer_id, buyer_name, status, total_amount, item_count, created_at FROM order_summary WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT $2", [user.id, limit]);
  return NextResponse.json({ orders: result.rows });
}