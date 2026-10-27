import express from "express";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidCallbackSecret, normalizeKenyanPhone } from "./mpesa.js";
import {
  createPayment,
  getPayment,
  updatePayment
} from "./mpesa-store.js";
import {
  addChamaMember,
  createFinancialApproval,
  decideFinancialApproval,
  getChamaData,
  getChamaRole,
  getChamasForUser,
  initializeAuthStore,
  listChamaMembers,
  listFinancialApprovals,
  saveChamaData,
  updateChamaMemberRole
} from "./auth-store.js";
import { authRouter, getAuthenticatedUser, requireAuth } from "./auth.js";

const app = express();
const PORT = Number(process.env.AKIBA_PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const darajaBaseUrl = "https://sandbox.safaricom.co.ke";
const paymentAttempts = new Map();
const chamaRoles = new Set(["chairperson", "treasurer", "secretary", "ordinary_member"]);
const roleCapabilities = {
  chairperson: new Set(["manage_members", "manage_roles", "manage_finances", "manage_settings", "view_approvals", "approve_finances"]),
  treasurer: new Set(["manage_finances", "view_approvals", "approve_finances"]),
  secretary: new Set(["manage_members"]),
  ordinary_member: new Set()
};
const privateStaticPaths = new Set([
  "/server.js",
  "/auth.js",
  "/auth-store.js",
  "/mpesa.js",
  "/mpesa-store.js"
]);

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use("/api/auth", authRouter);

app.get("/login.html", async (req, res, next) => {
  const user = await getAuthenticatedUser(req);
  if (user?.adminAuthorized) {
    res.redirect("/dashboard.html");
    return;
  }
  next();
});

app.get("/dashboard.html", requireAuth, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  res.json({
    totalMembers: 0,
    totalContributions: 0,
    totalExpenses: 0,
    availableBalance: 0
  });
});

app.get("/api/chamas", requireAuth, async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ chamas: await getChamasForUser(req.authenticatedUser.id) });
});

app.get("/api/chamas/:chamaId/data", requireAuth, requireChamaAccess(), async (req, res) => {
  const data = await getChamaData(req.chamaId);
  if (!data) {
    res.status(404).json({ error: "Chama records were not found." });
    return;
  }
  res.set("Cache-Control", "no-store");
  res.json({ data: visibleChamaData(data, req.chamaRole), role: req.chamaRole });
});

app.put("/api/chamas/:chamaId/data", requireAuth, requireSameOriginApi, requireChamaAccess(), async (req, res) => {
  const current = await getChamaData(req.chamaId);
  if (!current) {
    res.status(404).json({ error: "Chama records were not found." });
    return;
  }
  const submitted = req.body?.data;
  if (!isValidChamaData(submitted)) {
    res.status(400).json({ error: "The submitted chama records are invalid." });
    return;
  }
  const visible = visibleChamaData(current, req.chamaRole);
  const sections = ["members", "contributions", "loans", "transactions", "settings", "pendingMpesaPayments"];
  for (const section of sections) {
    if (!canEditSection(req.chamaRole, section) &&
        JSON.stringify(submitted[section]) !== JSON.stringify(visible[section])) {
      res.status(403).json({ error: `Your chama role cannot update ${section}.` });
      return;
    }
  }

  const next = { ...current };
  for (const section of sections) {
    if (canEditSection(req.chamaRole, section)) next[section] = submitted[section];
  }
  const changed = changedChamaSections(current, next);
  for (const section of changed) {
    if (!canEditSection(req.chamaRole, section)) {
      res.status(403).json({ error: `Your chama role cannot update ${section}.` });
      return;
    }
  }

  if (req.chamaRole === "treasurer") {
    for (const section of ["contributions", "loans", "transactions"]) {
      if (!isAppendOnly(current[section], next[section])) {
        res.status(403).json({ error: "Treasurers may add financial records but cannot rewrite existing records." });
        return;
      }
    }
    for (const contribution of next.contributions.slice(current.contributions.length)) {
      if (contribution.paymentMethod !== "M-Pesa") continue;
      const payment = getPayment(contribution.checkoutRequestId, req.authenticatedUser.id);
      if (
        !payment || payment.chamaId !== req.chamaId || payment.status !== "completed" ||
        payment.amount !== contribution.amount || payment.receiptNumber !== contribution.receiptNumber
      ) {
        res.status(403).json({ error: "M-Pesa contributions must match a confirmed payment for this chama." });
        return;
      }
    }
  }

  const significantOperation = getSignificantOperation(current, next);
  if (significantOperation && req.chamaRole !== "platform_admin") {
    const approval = await createFinancialApproval({
      chamaId: req.chamaId,
      requestedBy: req.authenticatedUser.id,
      amount: significantOperation.amount,
      description: significantOperation.description,
      baseDataHash: hashChamaData(current),
      proposedData: next
    });
    res.status(202).json({
      approval: { id: approval.id, status: approval.status, description: approval.description },
      data: current
    });
    return;
  }

  await saveChamaData(req.chamaId, next);
  res.json({ data: next });
});

app.get("/api/chamas/:chamaId/members", requireAuth, requireChamaAccess(), async (req, res) => {
  const members = await listChamaMembers(req.chamaId);
  res.json({
    members: req.chamaRole === "chairperson" || req.chamaRole === "platform_admin"
      ? members
      : members.map(({ email, ...member }) => member)
  });
});

app.post("/api/chamas/:chamaId/members", requireAuth, requireSameOriginApi, requireChamaAccess("manage_members"), async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const role = req.body?.role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    res.status(400).json({ error: "Enter a valid account email address." });
    return;
  }
  if (!chamaRoles.has(role)) {
    res.status(400).json({ error: "Choose a valid chama role." });
    return;
  }
  if (req.chamaRole === "secretary" && role !== "ordinary_member") {
    res.status(403).json({ error: "Secretaries can invite ordinary members only." });
    return;
  }

  const result = await addChamaMember({ chamaId: req.chamaId, email, role });
  if (result === "user_not_found") {
    res.status(404).json({ error: "Create the member's Akiba account before adding them to this chama." });
    return;
  }
  if (result === "already_member") {
    res.status(409).json({ error: "That account is already in this chama." });
    return;
  }
  if (result === "chairperson_exists") {
    res.status(409).json({ error: "This chama already has a chairperson." });
    return;
  }
  res.status(201).json({ message: "Member added to the chama." });
});

app.put("/api/chamas/:chamaId/members/:userId/role", requireAuth, requireSameOriginApi, requireChamaAccess("manage_roles"), async (req, res) => {
  const role = req.body?.role;
  if (!chamaRoles.has(role)) {
    res.status(400).json({ error: "Choose a valid chama role." });
    return;
  }
  const changed = await updateChamaMemberRole({
    chamaId: req.chamaId,
    userId: req.params.userId,
    role
  });
  if (!changed) {
    res.status(404).json({ error: "Member was not found or the chama already has a chairperson." });
    return;
  }
  res.json({ message: "Member role updated." });
});

app.get("/api/chamas/:chamaId/approvals", requireAuth, requireChamaAccess("view_approvals"), async (req, res) => {
  res.json({ approvals: await listFinancialApprovals(req.chamaId) });
});

app.post("/api/chamas/:chamaId/approvals/:approvalId/decision", requireAuth, requireSameOriginApi, requireChamaAccess("approve_finances"), async (req, res) => {
  const decision = req.body?.decision;
  if (!["approved", "rejected"].includes(decision)) {
    res.status(400).json({ error: "Choose approved or rejected." });
    return;
  }
  const current = await getChamaData(req.chamaId);
  if (!current) {
    res.status(404).json({ error: "Chama records were not found." });
    return;
  }
  const result = await decideFinancialApproval({
    approvalId: req.params.approvalId,
    chamaId: req.chamaId,
    reviewerId: req.authenticatedUser.id,
    decision,
    currentDataHash: hashChamaData(current)
  });
  if (result === "not_pending") {
    res.status(404).json({ error: "Pending approval was not found." });
    return;
  }
  if (result === "self_approval") {
    res.status(403).json({ error: "The requester cannot approve or reject their own operation." });
    return;
  }
  if (result === "stale") {
    res.status(409).json({ error: "Chama records changed after this request. Submit the operation again for approval." });
    return;
  }
  res.json({ status: result });
});

app.post("/api/mpesa/stk-push", requireAuth, requireSameOriginApi, limitPaymentAttempts, requireChamaAccess("manage_finances", true), async (req, res) => {
  const memberName = typeof req.body?.memberName === "string"
    ? req.body.memberName.trim()
    : "";
  const phone = normalizeKenyanPhone(req.body?.phone);
  const amount = Number(req.body?.amount);

  if (!memberName || memberName.length > 80) {
    res.status(400).json({ error: "Enter the member's name (up to 80 characters)." });
    return;
  }
  if (!phone) {
    res.status(400).json({ error: "Enter a valid Kenyan Safaricom phone number." });
    return;
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 150000) {
    res.status(400).json({ error: "Enter a whole-number amount between KES 1 and KES 150,000." });
    return;
  }

  const configuration = getDarajaConfiguration();
  if (!configuration) {
    res.status(503).json({
      error: "M-Pesa sandbox is not configured. Add the Daraja settings to akiba.app/.env and restart Akiba."
    });
    return;
  }

  try {
    const accessToken = await getAccessToken(configuration);
    const timestamp = createTimestamp();
    const password = Buffer.from(
      `${configuration.shortcode}${configuration.passkey}${timestamp}`
    ).toString("base64");
    const callbackUrl = new URL(configuration.callbackUrl);
    callbackUrl.searchParams.set("secret", configuration.callbackSecret);

    const response = await fetch(`${darajaBaseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        BusinessShortCode: configuration.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: configuration.shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl.toString(),
        AccountReference: "AKIBA",
        TransactionDesc: "Akiba savings"
      })
    });
    const result = await readDarajaResponse(response, "STK Push");

    if (String(result.ResponseCode) !== "0" || !result.CheckoutRequestID) {
      console.error("M-Pesa sandbox did not accept the STK Push:", result.ResponseDescription || result.errorMessage);
      res.status(502).json({
        error: result.ResponseDescription || result.errorMessage || "Safaricom did not accept the payment request."
      });
      return;
    }

    const payment = createPayment({
      checkoutRequestId: result.CheckoutRequestID,
      userId: req.authenticatedUser.id,
      chamaId: req.chamaId,
      memberName,
      phone,
      amount
    });
    res.status(202).json({
      checkoutRequestId: payment.checkoutRequestId,
      message: result.CustomerMessage || "Check your phone and approve the M-Pesa prompt."
    });
  } catch (error) {
    console.error("Could not start M-Pesa STK Push:", error);
    res.status(502).json({
      error: "Could not reach the M-Pesa sandbox. Check the Daraja settings and try again."
    });
  }
});

app.post("/api/mpesa/callback", (req, res) => {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET;
  if (!expectedSecret || !isValidCallbackSecret(req.query.secret, expectedSecret)) {
    res.status(401).json({ error: "Invalid callback credentials." });
    return;
  }

  const callback = req.body?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID;
  const payment = typeof checkoutRequestId === "string"
    ? getPayment(checkoutRequestId)
    : null;

  if (!payment) {
    res.status(404).json({ error: "Payment request was not found." });
    return;
  }
  if (payment.status !== "pending") {
    res.json({ ResultCode: 0, ResultDesc: "Callback already processed." });
    return;
  }

  if (Number(callback.ResultCode) !== 0) {
    updatePayment(checkoutRequestId, {
      status: "failed",
      failureReason: safeText(callback.ResultDesc, "The payment was not completed.")
    });
    res.json({ ResultCode: 0, ResultDesc: "Callback received." });
    return;
  }

  const metadata = callback.CallbackMetadata?.Item;
  const receipt = metadata?.find((item) => item.Name === "MpesaReceiptNumber")?.Value;
  const paidAmount = Number(metadata?.find((item) => item.Name === "Amount")?.Value);
  const paidPhone = normalizeKenyanPhone(
    metadata?.find((item) => item.Name === "PhoneNumber")?.Value
  );

  if (
    typeof receipt !== "string" ||
    !receipt ||
    paidAmount !== payment.amount ||
    (paidPhone && paidPhone !== payment.phone)
  ) {
    console.error("M-Pesa callback did not match its pending payment:", checkoutRequestId);
    res.status(400).json({ error: "Payment confirmation did not match the request." });
    return;
  }

  updatePayment(checkoutRequestId, {
    status: "completed",
    receiptNumber: receipt,
    completedAt: new Date().toISOString()
  });
  res.json({ ResultCode: 0, ResultDesc: "Callback received." });
});

app.get("/api/mpesa/status/:checkoutRequestId", requireAuth, async (req, res) => {
  const payment = getPayment(req.params.checkoutRequestId, req.authenticatedUser.id);
  if (!payment || !(await getChamaRole(req.authenticatedUser.id, payment.chamaId))) {
    res.status(404).json({ error: "Payment request was not found." });
    return;
  }

  res.set("Cache-Control", "no-store");
  res.json({
    checkoutRequestId: payment.checkoutRequestId,
    memberName: payment.memberName,
    amount: payment.amount,
    status: payment.status,
    receiptNumber: payment.receiptNumber || null,
    failureReason: payment.failureReason || null,
    completedAt: payment.completedAt || null
  });
});

app.use((req, res, next) => {
  const pathname = req.path.toLowerCase();
  if (
    /^\/data(?:\/|$)/i.test(req.path) ||
    /^\/tests(?:\/|$)/i.test(req.path) ||
    privateStaticPaths.has(pathname)
  ) {
    res.sendStatus(404);
    return;
  }
  next();
});
app.use(express.static(__dirname));

function getDarajaConfiguration() {
  const shortcode = process.env.MPESA_TILL_NUMBER?.trim();
  const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  const callbackUrl = process.env.MPESA_CALLBACK_URL?.trim();
  const callbackSecret = process.env.MPESA_CALLBACK_SECRET?.trim();

  if (!shortcode || !consumerKey || !consumerSecret || !passkey || !callbackUrl || !callbackSecret) {
    return null;
  }

  try {
    const parsedCallbackUrl = new URL(callbackUrl);
    if (
      parsedCallbackUrl.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "::1"].includes(parsedCallbackUrl.hostname)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { shortcode, consumerKey, consumerSecret, passkey, callbackUrl, callbackSecret };
}

async function getAccessToken(configuration) {
  const credentials = Buffer.from(
    `${configuration.consumerKey}:${configuration.consumerSecret}`
  ).toString("base64");
  const response = await fetch(
    `${darajaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(10000)
    }
  );
  const result = await readDarajaResponse(response, "OAuth");
  if (typeof result.access_token !== "string" || !result.access_token) {
    throw new Error("Daraja OAuth response did not contain an access token.");
  }
  return result.access_token;
}

async function readDarajaResponse(response, operation) {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Daraja ${operation} response was not valid JSON (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(`Daraja ${operation} request failed (HTTP ${response.status}): ${JSON.stringify(result)}`);
  }
  return result;
}

function createTimestamp() {
  const date = new Date();
  const part = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`;
}

function safeText(value, fallback) {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, 160)
    : fallback;
}

function requireChamaAccess(capability, useBodyChamaId = false) {
  return async (req, res, next) => {
    let chamaId = useBodyChamaId ? req.body?.chamaId : req.params.chamaId;
    if (useBodyChamaId && !chamaId) {
      const chamas = await getChamasForUser(req.authenticatedUser.id);
      chamaId = chamas[0]?.id;
    }
    if (typeof chamaId !== "string" || !chamaId || chamaId.length > 100) {
      res.status(400).json({ error: "Choose a chama to continue." });
      return;
    }

    const role = await getChamaRole(req.authenticatedUser.id, chamaId);
    if (!role) {
      res.status(404).json({ error: "Chama was not found." });
      return;
    }
    if (capability && role !== "platform_admin" && !roleCapabilities[role]?.has(capability)) {
      res.status(403).json({ error: "Your chama role does not allow this operation." });
      return;
    }
    req.chamaId = chamaId;
    req.chamaRole = role;
    next();
  };
}

function requireSameOriginApi(req, res, next) {
  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }
  try {
    if (new URL(origin).host === req.get("host")) {
      next();
      return;
    }
  } catch {}
  res.status(403).json({ error: "This request origin is not allowed." });
}

function canEditSection(role, section) {
  if (role === "platform_admin") return true;
  if (section === "members") return roleCapabilities[role]?.has("manage_members") === true;
  if (section === "settings") return roleCapabilities[role]?.has("manage_settings") === true;
  if (["contributions", "loans", "transactions"].includes(section)) {
    return roleCapabilities[role]?.has("manage_finances") === true;
  }
  if (section === "pendingMpesaPayments") return roleCapabilities[role]?.has("manage_finances") === true;
  return false;
}

function isAppendOnly(current, next) {
  return next.length >= current.length && current.every((item, index) =>
    JSON.stringify(item) === JSON.stringify(next[index])
  );
}

function visibleChamaData(data, role) {
  const visible = JSON.parse(JSON.stringify(data));
  if (["ordinary_member"].includes(role)) {
    visible.members = visible.members.map(({ phone, email, ...member }) => member);
  }
  if (!new Set(["chairperson", "platform_admin"]).has(role)) {
    visible.settings.adminEmail = "";
  }
  return visible;
}

function changedChamaSections(current, next) {
  return ["members", "contributions", "loans", "transactions", "settings", "pendingMpesaPayments"]
    .filter((section) => JSON.stringify(current[section]) !== JSON.stringify(next[section]));
}

function isValidChamaData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const sections = ["members", "contributions", "loans", "transactions", "pendingMpesaPayments"];
  if (Object.keys(data).some((key) => ![...sections, "settings"].includes(key))) return false;
  if (sections.some((section) => !Array.isArray(data[section]) || data[section].length > 10000)) return false;
  if (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings)) return false;
  if (typeof data.settings.chamaName !== "string" || data.settings.chamaName.length < 1 || data.settings.chamaName.length > 100) return false;
  if (typeof data.settings.adminName !== "string" || data.settings.adminName.length < 1 || data.settings.adminName.length > 80) return false;
  if (typeof (data.settings.adminEmail || "") !== "string" || (data.settings.adminEmail || "").length > 254) return false;
  if (!Number.isInteger(data.settings.contributionDueDay) || data.settings.contributionDueDay < 1 || data.settings.contributionDueDay > 28) return false;
  return JSON.stringify(data).length <= 5 * 1024 * 1024;
}

function getSignificantOperation(current, next) {
  const threshold = 50000;
  const isNew = (entry, existing) => !existing.some((item) => JSON.stringify(item) === JSON.stringify(entry));
  const largeLoan = next.loans.find((loan) =>
    isNew(loan, current.loans) && Number.isFinite(loan.amount) && loan.amount >= threshold
  );
  if (largeLoan) {
    return { amount: largeLoan.amount, description: `Loan to ${safeText(largeLoan.borrower, "chama member")}` };
  }
  const largeExpense = next.transactions.find((transaction) =>
    isNew(transaction, current.transactions) && transaction.type === "expense" &&
    Number.isFinite(transaction.amount) && transaction.amount >= threshold
  );
  return largeExpense
    ? { amount: largeExpense.amount, description: safeText(largeExpense.description, "Large chama expense") }
    : null;
}

function hashChamaData(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

function limitPaymentAttempts(req, res, next) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = paymentAttempts.get(key);
  if (!current || current.resetAt <= now) {
    paymentAttempts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }
  if (current.count >= 5) {
    res.status(429).json({ error: "Too many payment attempts. Please wait before trying again." });
    return;
  }
  current.count += 1;
  next();
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    await initializeAuthStore();
  } catch (error) {
    console.error("Could not initialize Akiba's PostgreSQL account database:", error);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Akiba is running at http://localhost:${PORT}`);
  });
}

export { app };
