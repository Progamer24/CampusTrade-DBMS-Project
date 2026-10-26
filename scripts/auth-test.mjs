import { randomBytes } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const baseUrl = process.env.AUTH_TEST_BASE_URL || "http://127.0.0.1:3000";
if (!process.env.DATABASE_URL) {
  console.error("BLOCKED: DATABASE_URL is not set.");
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const unique = randomBytes(8).toString("hex");
const email = `auth-test-${unique}@campus.edu`;
const password = `${randomBytes(18).toString("base64url")}Aa1!`;
let userId;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cookieFrom(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  const session = cookies.find((cookie) => cookie.startsWith("campustrade_session="));
  assert(session, "authentication response did not set a session cookie");
  return session.split(";", 1)[0];
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, { ...options, redirect: "manual" });
}

try {
  const registerResponse = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName: "Authentication Test User", email, password, role: "Admin" }),
  });
  assert(registerResponse.status === 201, `registration returned ${registerResponse.status}`);
  const registered = await registerResponse.json();
  assert(registered.user?.role === "Student", "registration accepted an admin role request");
  assert(!("password_hash" in registered.user), "registration exposed a password hash");
  userId = registered.user.id;
  const storedUser = await pool.query("SELECT password_hash, role FROM users WHERE id = $1", [userId]);
  assert(storedUser.rows[0]?.role === "Student", "registered user did not persist as Student");
  assert(typeof storedUser.rows[0]?.password_hash === "string" && storedUser.rows[0].password_hash.startsWith("$2") && storedUser.rows[0].password_hash !== password, "password was not stored as a bcrypt hash");
  const sessionCookie = cookieFrom(registerResponse);
  console.log("PASS: student registration creates a session, stores a bcrypt hash, and cannot self-assign Admin.");

  const meResponse = await request("/api/auth/me", { headers: { cookie: sessionCookie } });
  assert(meResponse.status === 200, `session lookup returned ${meResponse.status}`);
  const me = await meResponse.json();
  assert(me.user?.email === email && me.user?.role === "Student", "session lookup returned the wrong user");
  console.log("PASS: session persists through /api/auth/me without exposing sensitive data.");

  const dashboardResponse = await request("/dashboard", { headers: { cookie: sessionCookie } });
  const anonymousDashboardResponse = await request("/dashboard");
  assert(dashboardResponse.status === 200, `authenticated dashboard returned ${dashboardResponse.status}`);
  assert([307, 308].includes(anonymousDashboardResponse.status), `anonymous dashboard returned ${anonymousDashboardResponse.status}`);
  console.log("PASS: dashboard data is server-protected for authenticated users.");

  const duplicateResponse = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName: "Duplicate User", email, password }),
  });
  assert(duplicateResponse.status === 409, `duplicate registration returned ${duplicateResponse.status}`);
  console.log("PASS: duplicate email registration is rejected.");

  const wrongPasswordResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: `${password}wrong` }),
  });
  const unknownEmailResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `unknown-${unique}@campus.edu`, password }),
  });
  assert(wrongPasswordResponse.status === 401 && unknownEmailResponse.status === 401, "invalid credentials did not return 401");
  const wrongBody = await wrongPasswordResponse.json();
  const unknownBody = await unknownEmailResponse.json();
  assert(wrongBody.error?.message === unknownBody.error?.message, "login errors reveal account existence");
  console.log("PASS: invalid credentials use a generic 401 response.");

  const anonymousAdminResponse = await request("/api/admin/ping");
  assert(anonymousAdminResponse.status === 401, `anonymous admin request returned ${anonymousAdminResponse.status}`);
  const studentAdminResponse = await request("/api/admin/ping", { headers: { cookie: sessionCookie } });
  assert(studentAdminResponse.status === 403, `student admin request returned ${studentAdminResponse.status}`);
  const studentAdminPageResponse = await request("/admin", { headers: { cookie: sessionCookie } });
  assert([307, 308].includes(studentAdminPageResponse.status), `student admin page returned ${studentAdminPageResponse.status}`);
  console.log("PASS: admin endpoint returns 401 anonymously and 403 for Students.");

  const crossOriginLogoutResponse = await request("/api/auth/logout", { method: "POST", headers: { cookie: sessionCookie, origin: "https://attacker.invalid" } });
  assert(crossOriginLogoutResponse.status === 403, `cross-origin logout returned ${crossOriginLogoutResponse.status}`);
  console.log("PASS: cross-origin logout is rejected.");

  const logoutResponse = await request("/api/auth/logout", { method: "POST", headers: { cookie: sessionCookie, origin: baseUrl } });
  assert(logoutResponse.status === 204, `logout returned ${logoutResponse.status}`);
  const invalidatedResponse = await request("/api/auth/me", { headers: { cookie: sessionCookie } });
  assert(invalidatedResponse.status === 401, `invalidated session returned ${invalidatedResponse.status}`);
  console.log("PASS: logout invalidates the persistent session.");
} catch (error) {
  console.error(`FAIL: authentication verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (userId) await pool.query("DELETE FROM users WHERE id = $1", [userId]).catch(() => undefined);
  await pool.end();
}