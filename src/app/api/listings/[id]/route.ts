import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { mongoDb, postgresId, publicListingMetadata } from "@/lib/server/mongodb";

type Context = { params: Promise<{ id: string }> };

async function findItem(id: string) {
  const result = await query<{ id: string; seller_id: string; seller_name: string; category: string; price: string; status: string; created_at: Date }>("SELECT i.id, i.seller_id, u.full_name AS seller_name, i.category, i.price, i.status, i.created_at FROM items i JOIN users u ON u.id = i.seller_id WHERE i.id = $1", [id]);
  return result.rows[0];
}

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return jsonError(400, "INVALID_ID", "Invalid listing identifier.");
  try {
    const item = await findItem(id);
    if (!item || item.status !== "Available") return jsonError(404, "NOT_FOUND", "Listing not found.");
    const db = await mongoDb();
    const metadata = await db.collection("listings").findOne({ postgresItemId: postgresId(id), status: "Active" });
    if (!metadata) return jsonError(404, "NOT_FOUND", "Listing not found.");
    return NextResponse.json({ listing: { id: item.id, sellerId: item.seller_id, seller: item.seller_name, category: item.category, price: Number(item.price), status: item.status, createdAt: item.created_at, ...publicListingMetadata(metadata as unknown as Record<string, unknown>) } });
  } catch { console.error("Listing detail failed."); return jsonError(503, "LISTING_UNAVAILABLE", "Listing is temporarily unavailable."); }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to edit a listing.");
  const item = await findItem(id);
  if (!item) return jsonError(404, "NOT_FOUND", "Listing not found.");
  if (item.seller_id !== user.id && user.role !== "Admin") return jsonError(403, "FORBIDDEN", "You do not own this listing.");
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return jsonError(400, "INVALID_JSON", "Invalid request body."); }
  const updates: Record<string, unknown> = {};
  const metadataUpdates: Record<string, unknown> = {};
  if (typeof input.title === "string" && input.title.trim().length >= 2 && input.title.trim().length <= 160) metadataUpdates.title = input.title.trim();
  if (typeof input.description === "string" && input.description.trim().length >= 2 && input.description.trim().length <= 4000) metadataUpdates.description = input.description.trim();
  if (typeof input.category === "string") updates.category = input.category;
  if (input.price !== undefined) updates.price = Number(input.price);
  if (typeof input.status === "string" && ["Available", "Removed"].includes(input.status)) updates.status = input.status;
  if (typeof input.condition === "string" && ["Like New", "Good", "Fair"].includes(input.condition)) metadataUpdates.condition = input.condition;
  if (Object.keys(updates).length === 0 && Object.keys(metadataUpdates).length === 0) return jsonError(400, "VALIDATION_ERROR", "No permitted listing fields supplied.");
  if (updates.category && !["Books", "Electronics", "Accessories", "Other"].includes(String(updates.category))) return jsonError(400, "VALIDATION_ERROR", "Invalid category.");
  if (updates.price !== undefined && (!Number.isFinite(Number(updates.price)) || Number(updates.price) <= 0)) return jsonError(400, "VALIDATION_ERROR", "Invalid price.");
  const assignments = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(", ");
  if (Object.keys(updates).length) await query(`UPDATE items SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = $${Object.keys(updates).length + 1}`, [...Object.values(updates), id]);
  const mongoUpdate = { ...metadataUpdates, ...(updates.status ? { status: updates.status === "Available" ? "Active" : "Removed" } : {}), updatedAt: new Date() };
  if (Object.keys(mongoUpdate).length) await (await mongoDb()).collection("listings").updateOne({ postgresItemId: postgresId(id) }, { $set: mongoUpdate });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to remove a listing.");
  const item = await findItem(id);
  if (!item) return jsonError(404, "NOT_FOUND", "Listing not found.");
  if (item.seller_id !== user.id && user.role !== "Admin") return jsonError(403, "FORBIDDEN", "You do not own this listing.");
  if (item.status === "Sold") return jsonError(409, "ALREADY_SOLD", "Sold listings cannot be removed.");
  await query("UPDATE items SET status = 'Removed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
  await (await mongoDb()).collection("listings").updateOne({ postgresItemId: postgresId(id) }, { $set: { status: "Removed", updatedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}