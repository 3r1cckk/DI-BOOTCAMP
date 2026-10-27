import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { normalizeKenyanPhone } from "../mpesa.js";

const dataDirectory = mkdtempSync(path.join(tmpdir(), "akiba-mpesa-test-"));
process.env.MPESA_DATA_PATH = path.join(dataDirectory, "payments.json");
process.env.MPESA_CONSUMER_KEY = "test-consumer-key";
process.env.MPESA_CONSUMER_SECRET = "test-consumer-secret";
process.env.MPESA_TILL_NUMBER = "600000";
process.env.MPESA_PASSKEY = "test-passkey";
process.env.MPESA_CALLBACK_URL = "https://example.test/api/mpesa/callback";
process.env.MPESA_CALLBACK_SECRET = "test-callback-secret";
process.env.AKIBA_AUTH_DATA_PATH = path.join(dataDirectory, "auth-users.json");
process.env.AKIBA_ADMIN_PASSWORD = "shared-admin-password-123";

const darajaCalls = [];
const originalFetch = globalThis.fetch;
const nativeFetch = originalFetch.bind(globalThis);
globalThis.fetch = async (url, options = {}) => {
  darajaCalls.push({ url: String(url), options });
  if (String(url).includes("/oauth/v1/generate")) {
    return Response.json({ access_token: "sandbox-access-token" });
  }
  if (String(url).includes("/mpesa/stkpush/v1/processrequest")) {
    return Response.json({
      ResponseCode: "0",
      CheckoutRequestID: "ws_CO_test_123",
      CustomerMessage: "Success. Request accepted for processing."
    });
  }
  throw new Error(`Unexpected external request: ${url}`);
};

const { app } = await import("../server.js");
const server = createServer(app);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;
let authCookie;

after(async () => {
  globalThis.fetch = originalFetch;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  rmSync(dataDirectory, { recursive: true, force: true });
});

async function requestJson(route, { method = "GET", body, authenticated = true } = {}) {
  const headers = body ? { "Content-Type": "application/json" } : {};
  if (authenticated && authCookie) headers.Cookie = authCookie;
  const response = await nativeFetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: response.status, body: await response.json() };
}

test("normalizes Kenyan mobile numbers for Daraja", () => {
  assert.equal(normalizeKenyanPhone("0712 345 678"), "254712345678");
  assert.equal(normalizeKenyanPhone("+254 112 345 678"), "254112345678");
  assert.equal(normalizeKenyanPhone("123"), null);
});

test("validates input and starts a Till STK Push without exposing credentials", async () => {
  const unauthenticated = await requestJson("/api/mpesa/stk-push", {
    method: "POST",
    authenticated: false,
    body: { memberName: "Amina", phone: "0712 345 678", amount: 500 }
  });
  assert.equal(unauthenticated.status, 401);
  assert.equal(darajaCalls.length, 0);

  const registrationResponse = await nativeFetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Amina Test",
      email: "amina@example.test",
      password: "secure-password-123",
      adminPassword: "shared-admin-password-123"
    })
  });
  assert.equal(registrationResponse.status, 201);
  authCookie = registrationResponse.headers.getSetCookie()[0].split(";")[0];

  const invalid = await requestJson("/api/mpesa/stk-push", {
    method: "POST",
    body: { memberName: "Amina", phone: "123", amount: 500 }
  });
  assert.equal(invalid.status, 400);
  assert.equal(darajaCalls.length, 0);

  const started = await requestJson("/api/mpesa/stk-push", {
    method: "POST",
    body: { memberName: "Amina", phone: "0712 345 678", amount: 500 }
  });
  assert.equal(started.status, 202);
  assert.equal(started.body.checkoutRequestId, "ws_CO_test_123");
  assert.equal(darajaCalls.length, 2);

  const stkRequest = JSON.parse(darajaCalls[1].options.body);
  assert.equal(stkRequest.TransactionType, "CustomerBuyGoodsOnline");
  assert.equal(stkRequest.PartyA, "254712345678");
  assert.equal(stkRequest.PartyB, "600000");
  assert.match(stkRequest.CallBackURL, /secret=test-callback-secret/);
  assert.doesNotMatch(JSON.stringify(started.body), /consumer-secret|passkey/);

  const pending = await requestJson("/api/mpesa/status/ws_CO_test_123");
  assert.equal(pending.status, 200);
  assert.equal(pending.body.status, "pending");

  const ownerCookie = authCookie;
  const secondRegistration = await nativeFetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Brian Test",
      email: "brian@example.test",
      password: "secure-password-456",
      adminPassword: "shared-admin-password-123"
    })
  });
  assert.equal(secondRegistration.status, 201);
  authCookie = secondRegistration.headers.getSetCookie()[0].split(";")[0];
  const otherUserPayment = await requestJson("/api/mpesa/status/ws_CO_test_123");
  assert.equal(otherUserPayment.status, 404);
  authCookie = ownerCookie;
});

test("rejects unauthenticated callbacks and records a matching confirmed payment", async () => {
  const unauthorized = await requestJson("/api/mpesa/callback", {
    method: "POST",
    body: { Body: { stkCallback: { CheckoutRequestID: "ws_CO_test_123", ResultCode: 0 } } }
  });
  assert.equal(unauthorized.status, 401);

  const confirmed = await requestJson(
    "/api/mpesa/callback?secret=test-callback-secret",
    {
      method: "POST",
      body: {
        Body: {
          stkCallback: {
            CheckoutRequestID: "ws_CO_test_123",
            ResultCode: 0,
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: 500 },
                { Name: "MpesaReceiptNumber", Value: "QAB123XYZ" },
                { Name: "PhoneNumber", Value: 254712345678 }
              ]
            }
          }
        }
      }
    }
  );
  assert.equal(confirmed.status, 200);

  const status = await requestJson("/api/mpesa/status/ws_CO_test_123");
  assert.equal(status.body.status, "completed");
  assert.equal(status.body.amount, 500);
  assert.equal(status.body.receiptNumber, "QAB123XYZ");
});
