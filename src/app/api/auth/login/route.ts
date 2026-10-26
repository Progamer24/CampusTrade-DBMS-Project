import { NextResponse } from "next/server";
import { createSession, jsonError, publicUser, setSessionCookie, validateLoginInput, verifyPassword } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid request body.");
  }
  const validated = validateLoginInput(input);
  if ("error" in validated) return jsonError(400, "VALIDATION_ERROR", validated.error ?? "Invalid request body.");

  const result = await query<{ id: string; full_name: string; email: string; role: "Student" | "Admin"; password_hash: string | null }>(
    "SELECT id, full_name, email, role, password_hash FROM users WHERE lower(email) = $1",
    [validated.email],
  );
  const user = result.rows[0];
  if (!user || !(await verifyPassword(validated.password, user.password_hash))) {
    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ user: publicUser(user) });
  setSessionCookie(response, token);
  return response;
}