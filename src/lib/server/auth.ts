import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { query } from "./db";

export const SESSION_COOKIE = "campustrade_session";
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export type AuthRole = "Student" | "Admin";
export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: AuthRole;
};

type UserRow = { id: string; full_name: string; email: string; role: AuthRole };

export function validateRegistrationInput(input: unknown) {
  if (!input || typeof input !== "object") return { error: "Invalid request body." };
  const body = input as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (fullName.length < 2 || fullName.length > 120) return { error: "Enter a valid full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return { error: "Enter a valid email address." };
  if (password.length < 8 || password.length > 72) return { error: "Password must be between 8 and 72 characters." };
  return { fullName, email, password };
}

export function validateLoginInput(input: unknown) {
  if (!input || typeof input !== "object") return { error: "Invalid request body." };
  const body = input as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 320 || password.length > 72) return { error: "Invalid email or password." };
  return { email, password };
}

export function publicUser(row: UserRow): AuthUser {
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  await query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 days')", [userId, tokenHash]);
  return token;
}

export async function deleteSession(token: string | undefined) {
  if (!token) return;
  await query("DELETE FROM sessions WHERE token_hash = $1", [hashSessionToken(token)]);
}

export async function getUserForSessionToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const result = await query<UserRow>(
    "SELECT u.id, u.full_name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP",
    [hashSessionToken(token)],
  );
  return result.rows[0] ? publicUser(result.rows[0]) : null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserForSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function requireApiUser(request: NextRequest) {
  return getUserForSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0] ?? requestUrl.protocol.replace(":", "");
  const hostOrigin = request.headers.get("host") ? `${protocol}://${request.headers.get("host")}` : requestUrl.origin;
  return origin === requestUrl.origin || origin === hostOrigin;
}