import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { startSmtpCapture } from "./smtp-capture.js";

const dataDirectory = mkdtempSync(path.join(tmpdir(), "akiba-rbac-test-"));
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

async function register(name, email) {
  const result = await requestJson("/api/auth/register", {
    method: "POST",
    body: {
      name,
      email,
      password: "secure-password-123"
    }
  });
  assert.equal(result.response.status, 202);
  const verified = await requestJson("/api/auth/verify-email", {
    method: "POST",
    body: { token: smtp.verificationTokenFor(email) }
  });
  assert.equal(verified.response.status, 200);
  return verified.response.headers.getSetCookie()[0].split(";")[0];
}

test("chama roles enforce tenant isolation and financial approvals", async () => {
  const chairCookie = await register("Chairperson Test", "chairperson@example.test");
  const chairChamas = await requestJson("/api/chamas", { cookie: chairCookie });
  assert.equal(chairChamas.body.chamas.length, 1);
  const chama = chairChamas.body.chamas[0];
  assert.equal(chama.role, "chairperson");

  const memberCookie = await register("Treasurer Test", "treasurer@example.test");
  const memberChamas = await requestJson("/api/chamas", { cookie: memberCookie });
  const otherChamaId = memberChamas.body.chamas[0].id;
  const crossTenantRead = await requestJson(`/api/chamas/${otherChamaId}/data`, { cookie: chairCookie });
  assert.equal(crossTenantRead.response.status, 404);

  const added = await requestJson(`/api/chamas/${chama.id}/members`, {
    method: "POST",
    cookie: chairCookie,
    body: { email: "treasurer@example.test", role: "ordinary_member" }
  });
  assert.equal(added.response.status, 201);

  const memberData = await requestJson(`/api/chamas/${chama.id}/data`, { cookie: memberCookie });
  assert.equal(memberData.response.status, 200);
  assert.equal(memberData.body.role, "ordinary_member");
  const unauthorizedWrite = structuredClone(memberData.body.data);
  unauthorizedWrite.transactions.push({
    description: "Unauthorized expense",
    type: "expense",
    amount: 100,
    date: new Date().toISOString()
  });
  const deniedWrite = await requestJson(`/api/chamas/${chama.id}/data`, {
    method: "PUT",
    cookie: memberCookie,
    body: { data: unauthorizedWrite }
  });
  assert.equal(deniedWrite.response.status, 403);
  const deniedAuditRead = await requestJson(`/api/chamas/${chama.id}/audit-log`, {
    cookie: memberCookie
  });
  assert.equal(deniedAuditRead.response.status, 403);

  const membership = await requestJson(`/api/chamas/${chama.id}/members`, { cookie: chairCookie });
  const treasurer = membership.body.members.find((item) => item.email === "treasurer@example.test");
  assert.ok(treasurer);
  const promoted = await requestJson(`/api/chamas/${chama.id}/members/${treasurer.id}/role`, {
    method: "PUT",
    cookie: chairCookie,
    body: { role: "treasurer" }
  });
  assert.equal(promoted.response.status, 200);

  const treasurerData = await requestJson(`/api/chamas/${chama.id}/data`, { cookie: memberCookie });
  const loanData = structuredClone(treasurerData.body.data);
  const loan = {
    id: "loan-test-1",
    borrower: "Treasurer Test",
    amount: 1000,
    interestRate: 10,
    dueDate: "2027-01-01",
    issuedAt: new Date().toISOString()
  };
  loanData.loans.push(loan);
  loanData.transactions.push({
    description: "Loan to Treasurer Test",
    type: "expense",
    amount: 1000,
    date: new Date().toISOString()
  });
  const loanSaved = await requestJson(`/api/chamas/${chama.id}/data`, {
    method: "PUT",
    cookie: memberCookie,
    body: { data: loanData }
  });
  assert.equal(loanSaved.response.status, 200);

  const dataWithLoan = await requestJson(`/api/chamas/${chama.id}/data`, { cookie: memberCookie });
  const repaymentData = structuredClone(dataWithLoan.body.data);
  repaymentData.loanRepayments.push({
    id: "repayment-test-1",
    loanId: loan.id,
    amount: 500,
    date: new Date().toISOString()
  });
  repaymentData.transactions.push({
    description: "Loan repayment — Treasurer Test",
    type: "income",
    amount: 500,
    date: new Date().toISOString()
  });
  const repaymentSaved = await requestJson(`/api/chamas/${chama.id}/data`, {
    method: "PUT",
    cookie: memberCookie,
    body: { data: repaymentData }
  });
  assert.equal(repaymentSaved.response.status, 200);

  const overpaidData = structuredClone(repaymentSaved.body.data);
  overpaidData.loanRepayments.push({
    id: "repayment-test-overpaid",
    loanId: loan.id,
    amount: 601,
    date: new Date().toISOString()
  });
  const overpaid = await requestJson(`/api/chamas/${chama.id}/data`, {
    method: "PUT",
    cookie: memberCookie,
    body: { data: overpaidData }
  });
  assert.equal(overpaid.response.status, 400);

  const updatedTreasurerData = await requestJson(`/api/chamas/${chama.id}/data`, { cookie: memberCookie });
  const proposedData = structuredClone(updatedTreasurerData.body.data);
  proposedData.transactions.push({
    description: "Community hall loan",
    type: "expense",
    amount: 60000,
    date: new Date().toISOString()
  });
  const proposal = await requestJson(`/api/chamas/${chama.id}/data`, {
    method: "PUT",
    cookie: memberCookie,
    body: { data: proposedData }
  });
  assert.equal(proposal.response.status, 202);
  assert.equal(proposal.body.approval.status, "pending");

  const treasurerApprovals = await requestJson(`/api/chamas/${chama.id}/approvals`, {
    cookie: memberCookie
  });
  assert.equal(treasurerApprovals.body.approvals[0].canReview, false);
  const selfApproval = await requestJson(
    `/api/chamas/${chama.id}/approvals/${treasurerApprovals.body.approvals[0].id}/decision`,
    {
      method: "POST",
      cookie: memberCookie,
      body: { decision: "approved" }
    }
  );
  assert.equal(selfApproval.response.status, 403);

  const pendingApprovals = await requestJson(`/api/chamas/${chama.id}/approvals`, { cookie: chairCookie });
  assert.equal(pendingApprovals.body.approvals.length, 1);
  assert.equal(pendingApprovals.body.approvals[0].canReview, true);
  const approvalId = pendingApprovals.body.approvals[0].id;
  const approval = await requestJson(`/api/chamas/${chama.id}/approvals/${approvalId}/decision`, {
    method: "POST",
    cookie: chairCookie,
    body: { decision: "approved" }
  });
  assert.equal(approval.response.status, 200);

  const finalData = await requestJson(`/api/chamas/${chama.id}/data`, { cookie: chairCookie });
  const approvedExpense = finalData.body.data.transactions.find(
    (transaction) => transaction.description === "Community hall loan"
  );
  assert.equal(approvedExpense.amount, 60000);

  const auditLog = await requestJson(`/api/chamas/${chama.id}/audit-log`, { cookie: chairCookie });
  assert.equal(auditLog.response.status, 200);
  assert.ok(auditLog.body.entries.some((entry) =>
    entry.actorName === "Treasurer Test" && entry.summary.includes("Added 1 loan record.")
  ));
  assert.ok(auditLog.body.entries.some((entry) =>
    entry.actorName === "Treasurer Test" && entry.summary.includes("Added 1 loan repayment record.")
  ));
  assert.ok(auditLog.body.entries.some((entry) =>
    entry.action === "approval_requested" && entry.summary.includes("Community hall loan")
  ));
  assert.ok(auditLog.body.entries.some((entry) =>
    entry.action === "approval_approved" && entry.actorName === "Chairperson Test"
  ));
  assert.equal("actorId" in auditLog.body.entries[0], false);
});