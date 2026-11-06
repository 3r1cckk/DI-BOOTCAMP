import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { startSmtpCapture } from "./smtp-capture.js";

const dataDirectory = mkdtempSync(path.join(tmpdir(), "akiba-auth-test-"));
process.env.AKIBA_AUTH_DATA_PATH = path.join(dataDirectory, "auth-users.json");
process.env.MPESA_DATA_PATH = path.join(dataDirectory, "payments.json");
const smtp = await startSmtpCapture();
process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = String(smtp.port);
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "";
process.env.SMTP_PASSWORD = "";
process.env.AKIBA_EMAIL_FROM = "Akiba <no-reply@example.test>";

const { app } = await import("../server.js");
const { createSession } = await import("../auth-store.js");
let verifiedToken;
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
  await smtp.close();
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

test("landing experience separates the homepage from its features page", async () => {
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
  assert.match(html, /href="features\.html#features"/);
  assert.doesNotMatch(html, /id="features"|id="how-it-works"|id="about"/);

  const featuresResponse = await fetch(`${baseUrl}/features.html`);
  assert.equal(featuresResponse.status, 200);
  const featuresHtml = await featuresResponse.text();
  assert.match(featuresHtml, /Akiba — Features for your chama/);
  assert.match(featuresHtml, /id="features"/);
  assert.match(featuresHtml, /id="how-it-works"/);
  assert.match(featuresHtml, /id="about"/);
  assert.match(featuresHtml, /href="index\.html#auth"/);

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
  assert.equal(registration.response.status, 202);
  assert.match(registration.body.message, /Check your inbox/);
  assert.equal(registration.response.headers.get("set-cookie"), null);
  assert.doesNotMatch(await (await requestJson("/login.html")).response.text(), /name="adminPassword"/);
  const pendingLogin = await requestJson("/api/auth/login", {
    method: "POST",
    body: {
      email: "amina@example.test",
      password: "secure-password-123"
    }
  });
  assert.equal(pendingLogin.response.status, 403);
  assert.equal(pendingLogin.body.code, "email_not_verified");

  const originalVerificationToken = smtp.verificationTokenFor("amina@example.test");
  const resent = await requestJson("/api/auth/verification/resend", {
    method: "POST",
    body: { email: "amina@example.test" }
  });
  assert.equal(resent.response.status, 202);
  assert.match(resent.body.message, /If an unverified account exists/);
  const verificationToken = smtp.verificationTokenFor("amina@example.test");
  assert.notEqual(verificationToken, originalVerificationToken);
  const expiredVerification = await requestJson("/api/auth/verify-email", {
    method: "POST",
    body: { token: originalVerificationToken }
  });
  assert.equal(expiredVerification.response.status, 410);
  const verified = await requestJson("/api/auth/verify-email", {
    method: "POST",
    body: { token: verificationToken }
  });
  assert.equal(verified.response.status, 200);
  assert.equal(verified.body.user.email, "amina@example.test");
  assert.equal(verified.body.user.name, "Amina Wanjiku");
  assert.equal(verified.body.user.emailVerified, true);
  verifiedToken = verificationToken;
  assert.equal("password" in verified.body.user, false);
  const setCookie = verified.response.headers.getSetCookie()[0];
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.doesNotMatch(setCookie, /Secure/);
  assert.match(setCookie, /Path=\//);

  const saved = readFileSync(process.env.AKIBA_AUTH_DATA_PATH, "utf8");
  assert.doesNotMatch(saved, /secure-password-123/);
  assert.equal(saved.includes(verificationToken), false);
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

test("verification links are single-use", async () => {
  const invalid = await requestJson("/api/auth/verify-email", {
    method: "POST",
    body: { token: verifiedToken }
  });
  assert.equal(invalid.response.status, 410);
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
  assert.equal(blockedDashboard.response.headers.get("cache-control"), "no-store");

  const blockedDashboardApi = await requestJson("/api/dashboard");
  assert.equal(blockedDashboardApi.response.status, 401);
  assert.equal(blockedDashboardApi.body.error, "Please sign in to continue.");

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

  const logout = await requestJson("/api/auth/logout", {
    method: "POST",
    cookie,
    origin: baseUrl
  });
  assert.equal(logout.response.status, 200);
  assert.match(logout.response.headers.get("set-cookie"), /akibaSession=;/);
  assert.equal(logout.response.headers.get("cache-control"), "no-store");
  const expiredSession = await requestJson("/api/auth/session", { cookie });
  assert.equal(expiredSession.response.status, 401);
  const afterLogout = await requestJson("/dashboard.html", { cookie });
  assert.equal(afterLogout.response.status, 302);

  const repeatedLogout = await requestJson("/api/auth/logout", {
    method: "POST",
    cookie,
    origin: baseUrl
  });
  assert.equal(repeatedLogout.response.status, 200);
});
