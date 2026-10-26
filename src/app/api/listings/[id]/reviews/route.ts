import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/server/auth";
import { mongoDb, postgresId } from "@/lib/server/mongodb";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return jsonError(400, "INVALID_ID", "Invalid listing identifier.");
  const reviews = await (await mongoDb()).collection("reviews").find({ postgresItemId: postgresId(id) }).sort({ createdAt: -1 }).project({ _id: 0, reviewerId: 1, rating: 1, reviewText: 1, createdAt: 1 }).toArray();
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to review a listing.");
  const { id } = await params;
  if (!/^\d+$/.test(id)) return jsonError(400, "INVALID_ID", "Invalid listing identifier.");
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return jsonError(400, "INVALID_JSON", "Invalid request body."); }
  const rating = Number(input.rating);
  const reviewText = typeof input.reviewText === "string" ? input.reviewText.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 1 || reviewText.length > 2000) return jsonError(400, "VALIDATION_ERROR", "Rating and review text are invalid.");
  try {
    await (await mongoDb()).collection("reviews").insertOne({ postgresItemId: postgresId(id), reviewerId: postgresId(user.id), rating, reviewText, createdAt: new Date() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return jsonError(409, "DUPLICATE_REVIEW", "You have already reviewed this listing.");
    return jsonError(503, "REVIEW_FAILED", "The review could not be saved.");
  }
}