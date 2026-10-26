import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { mongoDb } from "@/lib/server/mongodb";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (user.role !== "Admin") return jsonError(403, "FORBIDDEN", "Admin access is required.");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const conditions: string[] = ["TRUE"];
  const values: string[] = [];
  if (from) { values.push(from); conditions.push(`o.created_at >= $${values.length}`); }
  if (to) { values.push(to); conditions.push(`o.created_at < $${values.length}`); }
  const overview = await query(`SELECT COUNT(DISTINCT i.id)::INTEGER AS total_items, COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'Available')::INTEGER AS available_items, COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'Sold')::INTEGER AS sold_items, COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'Completed')::INTEGER AS completed_orders, COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'Completed'), 0)::NUMERIC(12,2) AS completed_revenue FROM items i LEFT JOIN order_items oi ON oi.item_id = i.id LEFT JOIN orders o ON o.id = oi.order_id AND ${conditions.join(" AND ")}`, values);
  const byCategory = await query(`SELECT i.category, COUNT(*)::INTEGER AS item_count, COALESCE(SUM(i.price), 0)::NUMERIC(12,2) AS listed_value FROM items i GROUP BY i.category HAVING COUNT(*) > 0 ORDER BY item_count DESC, i.category ASC`);
  const sellers = await query(`SELECT i.seller_id, u.full_name, COUNT(*)::INTEGER AS listing_count, (SELECT COUNT(*) FROM order_items oi JOIN orders o2 ON o2.id = oi.order_id WHERE oi.item_id IN (SELECT id FROM items WHERE seller_id = i.seller_id) AND o2.status = 'Completed')::INTEGER AS sold_count FROM items i JOIN users u ON u.id = i.seller_id GROUP BY i.seller_id, u.full_name ORDER BY sold_count DESC, listing_count DESC`);
  const mongo = await mongoDb();
  const reviewAggregation = await mongo.collection("reviews").aggregate([{ $group: { _id: "$postgresItemId", reviewCount: { $sum: 1 }, averageRating: { $avg: "$rating" } } }, { $sort: { averageRating: -1 } }, { $limit: 20 }, { $project: { _id: 0, postgresItemId: "$_id", reviewCount: 1, averageRating: { $round: ["$averageRating", 2] } } }]).toArray();
  return NextResponse.json({ overview: overview.rows[0], byCategory: byCategory.rows, sellers: sellers.rows, reviewAggregation });
}