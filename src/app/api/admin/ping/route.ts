import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (user.role !== "Admin") return jsonError(403, "FORBIDDEN", "You do not have permission to access this resource.");
  return NextResponse.json({ ok: true, user });
}