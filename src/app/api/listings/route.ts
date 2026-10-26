import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { pool, query } from "@/lib/server/db";
import { listingFilter, mongoDb, postgresId, publicListingMetadata } from "@/lib/server/mongodb";

const categories = new Set(["Books", "Electronics", "Accessories", "Other"]);
const conditions = new Set(["Like New", "Good", "Fair"]);

function parseLimit(value: string | null) {
  const parsed = Number(value || 12);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 50) : 12;
}

function listingResponse(row: { id: string; seller_id: string; seller_name: string; category: string; price: string; status: string; created_at: Date }, metadata: Record<string, unknown> | null) {
  return { id: row.id, sellerId: row.seller_id, seller: row.seller_name, category: row.category, price: Number(row.price), status: row.status, createdAt: row.created_at, ...publicListingMetadata(metadata) };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const queryText = params.get("q")?.trim() || "";
  const category = params.get("category")?.trim() || "";
  const condition = params.get("condition")?.trim() || "";
  const sort = params.get("sort") === "price_asc" ? "price ASC" : params.get("sort") === "price_desc" ? "price DESC" : "created_at DESC";
  const page = Math.max(1, Number(params.get("page") || 1));
  const limit = parseLimit(params.get("limit"));
  if (category && !categories.has(category)) return jsonError(400, "INVALID_CATEGORY", "Invalid category.");
  if (condition && !conditions.has(condition)) return jsonError(400, "INVALID_CONDITION", "Invalid condition.");
  const user = await getCurrentUser();
  const mine = params.get("mine") === "true";
  if (mine && !user) return jsonError(401, "UNAUTHENTICATED", "Sign in to view your listings.");

  try {
    const db = await mongoDb();
    const metadata = await db.collection("listings").find({ ...listingFilter({ query: queryText, category, condition }), ...(mine ? {} : { status: "Active" }) }).project({ postgresItemId: 1, title: 1, description: 1, category: 1, condition: 1, attributes: 1, imageMetadata: 1, status: 1 }).toArray();
    const ids = metadata.map((item) => item.postgresItemId.toString());
    if (ids.length === 0) return NextResponse.json({ listings: [], page, limit, total: 0 });
    const values: unknown[] = [ids, ...(mine ? [user?.id] : [])];
    const countResult = await query<{ count: string }>(`SELECT COUNT(*)::TEXT AS count FROM items i WHERE i.id = ANY($1::BIGINT[]) ${mine ? "AND i.seller_id = $2" : ""}`, values);
    const result = await query<{ id: string; seller_id: string; seller_name: string; category: string; price: string; status: string; created_at: Date }>(`SELECT i.id, i.seller_id, u.full_name AS seller_name, i.category, i.price, i.status, i.created_at FROM items i JOIN users u ON u.id = i.seller_id WHERE i.id = ANY($1::BIGINT[]) ${mine ? "AND i.seller_id = $2" : "AND i.status = 'Available'"} ORDER BY ${sort} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, (page - 1) * limit]);
    const byId = new Map(metadata.map((item) => [item.postgresItemId.toString(), item as unknown as Record<string, unknown>]));
    return NextResponse.json({ listings: result.rows.map((row) => listingResponse(row, byId.get(row.id) || null)), page, limit, total: Number(countResult.rows[0]?.count || 0) });
  } catch {
    console.error("Listing browse failed.");
    return jsonError(503, "LISTINGS_UNAVAILABLE", "Listings are temporarily unavailable.");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to create a listing.");
  let input: unknown;
  try { input = await request.json(); } catch { return jsonError(400, "INVALID_JSON", "Invalid request body."); }
  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const condition = typeof body.condition === "string" ? body.condition.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const attributes = body.attributes && typeof body.attributes === "object" && !Array.isArray(body.attributes) ? body.attributes : {};
  if (title.length < 2 || title.length > 160 || description.length < 2 || description.length > 4000 || !categories.has(category) || !conditions.has(condition) || !Number.isFinite(price) || price <= 0 || price > 1_000_000) return jsonError(400, "VALIDATION_ERROR", "Invalid listing fields.");

  const client = await pool.connect();
  let itemId: string | undefined;
  try {
    await client.query("BEGIN");
    const item = await client.query<{ id: string }>("INSERT INTO items (seller_id, category, price, status) VALUES ($1, $2, $3, 'Available') RETURNING id", [user.id, category, price.toFixed(2)]);
    itemId = item.rows[0].id;
    await client.query("COMMIT");
    const db = await mongoDb();
    await db.collection("listings").insertOne({ postgresItemId: postgresId(itemId), sellerId: postgresId(user.id), title, description, category, condition, status: "Active", attributes, imageMetadata: [], createdAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ id: itemId, status: "Available" }, { status: 201 });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    if (itemId) await query("UPDATE items SET status = 'Removed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [itemId]).catch(() => undefined);
    console.error("Listing creation failed.");
    return jsonError(503, "LISTING_CREATE_FAILED", "The listing could not be published. No available inventory was created.");
  } finally { client.release(); }
}