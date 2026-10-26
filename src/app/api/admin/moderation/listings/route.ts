import { NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (user.role !== "Admin") return jsonError(403, "FORBIDDEN", "Admin access is required.");
  const result = await query("SELECT i.id, i.category, i.price, i.status, i.created_at, u.full_name AS seller_name FROM items i JOIN users u ON u.id = i.seller_id WHERE i.status IN ('Available', 'Removed') ORDER BY i.created_at DESC LIMIT 100");
  return NextResponse.json({ listings: result.rows });
}