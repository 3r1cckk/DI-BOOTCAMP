import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const dataDirectory = mkdtempSync(path.join(tmpdir(), "akiba-auth-test-"));
process.env.AKIBA_AUTH_DATA_PATH = path.join(dataDirectory, "auth-users.json");
process.env.MPESA_DATA_PATH = path.join(dataDirectory, "payments.json");
process.env.AKIBA_ADMIN_PASSWORD = "shared-admin-password-123";

const { app } = await import("../server.js");
const { createSession } = await import("../auth-store.js");
const server = createServer(app);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  rmSync(dataDirectory, { recursive: true, force: true });
});

async function requestJson(route, { method = "GET", body, cookie, origin } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual"
  });
  const contentType = response.headers.get("content-type") || "";
  return {
    response,
    body: contentType.includes("application/json") ? await response.json() : null
  };
}

test("landing page remains the homepage and includes the in-page account dialog", async () => {
  const response = await fetch(`${baseUrl}/`, { redirect: "manual" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Akiba — Grow your chama, together/);
  assert.match(html, /Your people\.<br>Your plans\.<br><span>Your progress\.<\/span>/);
  assert.match(html, /id="authDialog"/);
  assert.match(html, /data-open-auth="login"/);
  assert.match(html, /landing-auth\.js/);
  assert.doesNotMatch(html, /name="adminPassword"/);
  assert.match(html, /assets\/akiba-logo\.png/);
  const logoResponse = await fetch(`${baseUrl}/assets/akiba-logo.png`);
  assert.equal(logoResponse.status, 200);
  assert.match(logoResponse.headers.get("content-type"), /image\/png/);
});

test("sign-up validates input and persists only a password hash", async () => {
  const invalid = await requestJson("/api/auth/register", {
    method: "POST",
    body: { name: "A", email: "invalid", password: "short" }
  });
  assert.equal(invalid.response.status, 400);

  const registration = await requestJson("/api/auth/register", {
    method: "POST",
    body: {
      name: "Amina Wanjiku",
      email: "AMINA@example.test",
      password: "secure-password-123"
    }
  });
  assert.equal(registration.response.status, 201);
  assert.equal(registration.body.user.email, "amina@example.test");
  assert.equal(registration.body.user.name, "Amina Wanjiku");
  assert.doesNotMatch(await (await requestJson("/login.html")).response.text(), /name="adminPassword"/);
  assert.equal("password" in registration.body.user, false);
  const setCookie = registration.response.headers.getSetCookie()[0];
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.doesNotMatch(setCookie, /Secure/);
  assert.match(setCookie, /Path=\//);

  const saved = readFileSync(process.env.AKIBA_AUTH_DATA_PATH, "utf8");
  assert.doesNotMatch(saved, /secure-password-123/);
  assert.doesNotMatch(saved, /shared-admin-password-123/);
  assert.match(saved, /passwordHash/);
  assert.match(saved, /passwordSalt/);

  const blockedOrigin = await requestJson("/api/auth/login", {
    method: "POST",
    origin: "https://attacker.example",
    body: {
      email: "amina@example.test",
      password: "secure-password-123"
    }
  });
  assert.equal(blockedOrigin.response.status, 403);
});

test("login, protected pages, session status, logout, and private auth files work", async () => {
  const duplicate = await requestJson("/api/auth/register", {
    method: "POST",
    body: {
      name: "Amina Wanjiku",
      email: "amina@example.test",
      password: "secure-password-123"
    }
  });
  assert.equal(duplicate.response.status, 409);

  const wrongLogin = await requestJson("/api/auth/login", {
    method: "POST",
    body: {
      email: "amina@example.test",
      password: "incorrect-password-123"
    }
  });
  assert.equal(wrongLogin.response.status, 401);

  const blockedDashboard = await requestJson("/dashboard.html");
  assert.equal(blockedDashboard.response.status, 302);
  assert.equal(blockedDashboard.response.headers.get("location"), "/login.html");

  const blockedPayment = await requestJson("/api/mpesa/stk-push", {
    method: "POST",
    body: { memberName: "Amina", phone: "0712345678", amount: 500 }
  });
  assert.equal(blockedPayment.response.status, 401);

  const login = await requestJson("/api/auth/login", {
    method: "POST",
    body: {
      email: "AMINA@example.test",
      password: "secure-password-123"
    }
  });
  assert.equal(login.response.status, 200);
  const cookie = login.response.headers.getSetCookie()[0].split(";")[0];

  const session = await requestJson("/api/auth/session", { cookie });
  assert.equal(session.response.status, 200);
  assert.equal(session.body.user.email, "amina@example.test");
  assert.equal("adminAuthorized" in session.body.user, false);

  const dashboard = await requestJson("/dashboard.html", { cookie });
  assert.equal(dashboard.response.status, 200);
  assert.match(await dashboard.response.text(), /signOutButton/);

  const legacySession = await createSession(session.body.user.id);
  const blockedLegacyDashboard = await requestJson("/dashboard.html", {
    cookie: `akibaSession=${legacySession.token}`
  });
  assert.equal(blockedLegacyDashboard.response.status, 302);

  const privateFile = await requestJson("/data/auth-users.json");
  assert.equal(privateFile.response.status, 404);

  const logout = await requestJson("/api/auth/logout", { method: "POST", cookie });
  assert.equal(logout.response.status, 200);
  const expiredSession = await requestJson("/api/auth/session", { cookie });
  assert.equal(expiredSession.response.status, 401);
  const afterLogout = await requestJson("/dashboard.html", { cookie });
  assert.equal(afterLogout.response.status, 302);
});
