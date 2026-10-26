import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const user = await requireApiUser(request);
  if (!user) return jsonError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return NextResponse.json({ user });
}