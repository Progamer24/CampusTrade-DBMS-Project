import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, deleteSession, requireSameOrigin, SESSION_COOKIE } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request)) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: "Request origin is not allowed." } }, { status: 403 });
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookie(response);
  return response;
}