import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWorkspaceCsv } from "../csv-export.js";

const now = new Date("2026-10-27T12:00:00.000Z");
const data = {
  settings: { chamaName: "Amina's Chama" },
  contributions: [
    {
      member: 'Amina, "Chair"',
      amount: 1200,
      date: "2026-10-10T12:00:00.000Z",
      paymentMethod: "M-Pesa",
      receiptNumber: "QAB123",
      checkoutRequestId: "checkout-123"
    }
  ],
  loans: [{
    id: "loan-1",
    borrower: "Brian",
    amount: 10000,
    interestRate: 10,
    dueDate: "2026-11-30",
    issuedAt: "2026-10-01T12:00:00.000Z"
  }],
  loanRepayments: [{
    id: "repayment-1",
    loanId: "loan-1",
    amount: 2500,
    date: "2026-10-20T12:00:00.000Z"
  }],
  transactions: [
    { description: "Member contribution", type: "income", amount: 1200, date: "2026-10-10T12:00:00.000Z" },
    { description: "Equipment", type: "expense", amount: 300, date: "2026-10-11T12:00:00.000Z" }
  ]
};

test("exports contribution receipts with correctly escaped CSV values", () => {
  const result = buildWorkspaceCsv("Contributions", data, now);
  assert.equal(result.filename, "Amina-s-Chama-contributions-2026-10-27.csv");
  assert.match(result.csv, /"Member","Amount \(KES\)","Date"/);
  assert.match(result.csv, /"Amina, ""Chair""","1200"/);
  assert.match(result.csv, /"QAB123","checkout-123"/);
  assert.ok(result.csv.startsWith("\uFEFF"));
});

test("exports loans with itemized repayments and balances", () => {
  const result = buildWorkspaceCsv("Loans", data, now);
  assert.match(result.csv, /"Loan","loan-1","Brian","10000","10"/);
  assert.match(result.csv, /"Repayment","loan-1","Brian","2500"/);
  assert.match(result.csv, /"11000","8500","Open"/);
});

test("exports transactions and report monthly summaries", () => {
  const transactions = buildWorkspaceCsv("Transactions", data, now);
  assert.match(transactions.csv, /"Equipment","expense","300"/);

  const report = buildWorkspaceCsv("Reports", data, now);
  assert.match(report.csv, /"Summary","All time","Outstanding loan balance","8500"/);
  assert.match(report.csv, /"Monthly","2026-10","Net cash flow","900"/);
});

test("protects spreadsheet exports from formula injection", () => {
  const result = buildWorkspaceCsv("Transactions", {
    ...data,
    transactions: [{
      description: " =HYPERLINK(\"https://example.test\")",
      type: "income",
      amount: -1,
      date: "2026-10-27T12:00:00.000Z"
    }]
  }, now);
  assert.match(result.csv, /"' =HYPERLINK\(""https:\/\/example\.test""\)"/);
  assert.match(result.csv, /"income","-1"/);
});

test("returns null for workspaces without a CSV export", () => {
  assert.equal(buildWorkspaceCsv("Settings", data, now), null);
});
