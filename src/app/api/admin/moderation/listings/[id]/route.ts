import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, requireSameOrigin } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { mongoDb, postgresId } from "@/lib/server/mongodb";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (user.role !== "Admin") return jsonError(403, "FORBIDDEN", "Admin access is required.");
  if (!requireSameOrigin(request)) return jsonError(403, "CSRF_REJECTED", "Request origin is not allowed.");
  const { id } = await params;
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return jsonError(400, "INVALID_JSON", "Invalid request body."); }
  const action = input.action;
  const status = action === "approve" ? "Available" : action === "reject" || action === "flag" ? "Removed" : "";
  if (!status) return jsonError(400, "VALIDATION_ERROR", "Unsupported moderation action.");
  const result = await query("UPDATE items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id", [status, id]);
  if (!result.rows[0]) return jsonError(404, "NOT_FOUND", "Listing not found.");
  await (await mongoDb()).collection("listings").updateOne({ postgresItemId: postgresId(id) }, { $set: { status: status === "Available" ? "Active" : "Removed", updatedAt: new Date() } });
  return NextResponse.json({ ok: true, status });
}