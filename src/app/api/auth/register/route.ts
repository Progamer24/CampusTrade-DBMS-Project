import { NextResponse } from "next/server";
import { createSession, hashPassword, jsonError, publicUser, setSessionCookie, validateRegistrationInput } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid request body.");
  }
  const validated = validateRegistrationInput(input);
  if ("error" in validated) return jsonError(400, "VALIDATION_ERROR", validated.error ?? "Invalid request body.");

  try {
    const passwordHash = await hashPassword(validated.password);
    const result = await query<{ id: string; full_name: string; email: string; role: "Student" | "Admin" }>(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'Student') RETURNING id, full_name, email, role",
      [validated.fullName, validated.email, passwordHash],
    );
    const token = await createSession(result.rows[0].id);
    const response = NextResponse.json({ user: publicUser(result.rows[0]) }, { status: 201 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return jsonError(409, "EMAIL_IN_USE", "An account with that email already exists.");
    }
    console.error("Registration failed.");
    return jsonError(500, "REGISTRATION_FAILED", "We could not create your account.");
  }
}