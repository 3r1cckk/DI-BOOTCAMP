import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { startSmtpCapture } from "./smtp-capture.js";

const dataDirectory = mkdtempSync(path.join(tmpdir(), "akiba-invitation-test-"));
const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;
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

async function requestJson(route, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return {
    response,
    body: response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : null
  };
}

async function register(name, email, inviteToken) {
  const result = await requestJson("/api/auth/register", {
    method: "POST",
    body: {
      name,
      email,
      password: "secure-password-123",
      ...(inviteToken ? { inviteToken } : {})
    }
  });
  if (result.response.status !== 202) return result;
  return requestJson("/api/auth/verify-email", {
    method: "POST",
    body: { token: smtp.verificationTokenFor(email) }
  });
}

test("invite links let new accounts join the chama and expire after one use", async () => {
  const chairRegistration = await register("Chairperson", "chair@example.test");
  assert.equal(chairRegistration.response.status, 200);
  const chairCookie = chairRegistration.response.headers.getSetCookie()[0].split(";")[0];
  const chamas = await requestJson("/api/chamas", { cookie: chairCookie });
  const chama = chamas.body.chamas[0];

  const created = await requestJson(`/api/chamas/${chama.id}/invitations`, {
    method: "POST",
    cookie: chairCookie,
    body: { role: "ordinary_member" }
  });
  assert.equal(created.response.status, 201);
  const inviteUrl = new URL(created.body.inviteUrl);
  assert.equal(inviteUrl.pathname, "/login.html");
  const token = inviteUrl.searchParams.get("invite");
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  const remainingLifetime = Date.parse(created.body.expiresAt) - Date.now();
  assert.ok(remainingLifetime > invitationLifetimeMs - 10000);
  assert.ok(remainingLifetime <= invitationLifetimeMs);
  assert.equal(readFileSync(process.env.AKIBA_AUTH_DATA_PATH, "utf8").includes(token), false);
  const authenticatedInvitePage = await fetch(`${baseUrl}/login.html?invite=${token}`, {
    headers: { Cookie: chairCookie },
    redirect: "manual"
  });
  assert.equal(authenticatedInvitePage.status, 200);

  const preview = await requestJson(`/api/invitations/${token}`);
  assert.equal(preview.response.status, 200);
  assert.equal(preview.body.invitation.chamaName, chama.name);
  assert.equal(preview.body.invitation.role, "ordinary_member");

  const invitedRegistration = await register("Invited Member", "invitee@example.test", token);
  assert.equal(invitedRegistration.response.status, 200);
  const invitedCookie = invitedRegistration.response.headers.getSetCookie()[0].split(";")[0];
  const invitedChamas = await requestJson("/api/chamas", { cookie: invitedCookie });
  assert.deepEqual(invitedChamas.body.chamas.map((item) => item.id), [chama.id]);
  assert.equal(invitedChamas.body.chamas[0].role, "ordinary_member");

  const usedInvite = await requestJson(`/api/invitations/${token}`);
  assert.equal(usedInvite.response.status, 410);
  const reused = await register("Another Member", "another@example.test", token);
  assert.equal(reused.response.status, 410);
});

test("existing accounts can accept a link and secretaries can invite ordinary members only", async () => {
  const chairLogin = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email: "chair@example.test", password: "secure-password-123" }
  });
  assert.equal(chairLogin.response.status, 200);
  const chairCookie = chairLogin.response.headers.getSetCookie()[0].split(";")[0];
  const chama = (await requestJson("/api/chamas", { cookie: chairCookie })).body.chamas[0];

  const existingRegistration = await register("Existing Account", "existing@example.test");
  assert.equal(existingRegistration.response.status, 200);
  const created = await requestJson(`/api/chamas/${chama.id}/invitations`, {
    method: "POST",
    cookie: chairCookie,
    body: { role: "treasurer" }
  });
  const token = new URL(created.body.inviteUrl).searchParams.get("invite");

  const existingLogin = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email: "existing@example.test", password: "secure-password-123" }
  });
  const existingCookie = existingLogin.response.headers.getSetCookie()[0].split(";")[0];
  const accepted = await requestJson(`/api/invitations/${token}/accept`, {
    method: "POST",
    cookie: existingCookie
  });
  assert.equal(accepted.response.status, 200);
  const joinedChamas = await requestJson("/api/chamas", { cookie: existingCookie });
  assert.ok(joinedChamas.body.chamas.some((item) => item.id === chama.id && item.role === "treasurer"));

  const secretaryRegistration = await register("Secretary", "secretary@example.test");
  assert.equal(secretaryRegistration.response.status, 200);
  const secretaryCookie = secretaryRegistration.response.headers.getSetCookie()[0].split(";")[0];
  const addedSecretary = await requestJson(`/api/chamas/${chama.id}/members`, {
    method: "POST",
    cookie: chairCookie,
    body: { email: "secretary@example.test", role: "secretary" }
  });
  assert.equal(addedSecretary.response.status, 201);

  const forbidden = await requestJson(`/api/chamas/${chama.id}/invitations`, {
    method: "POST",
    cookie: secretaryCookie,
    body: { role: "treasurer" }
  });
  assert.equal(forbidden.response.status, 403);
  const ordinaryInvite = await requestJson(`/api/chamas/${chama.id}/invitations`, {
    method: "POST",
    cookie: secretaryCookie,
    body: { role: "ordinary_member" }
  });
  assert.equal(ordinaryInvite.response.status, 201);
});
