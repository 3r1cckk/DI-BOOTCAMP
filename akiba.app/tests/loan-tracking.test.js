import assert from "node:assert/strict";
import { test } from "node:test";
import { getLoanBalance, summarizeLoans } from "../loan-tracking.js";

const loan = {
  id: "loan-1",
  borrower: "Amina",
  amount: 10000,
  interestRate: 10,
  dueDate: "2026-10-25"
};

test("calculates one-time simple interest, repayments, and overdue status", () => {
  const repayments = [
    { loanId: loan.id, amount: 2500 },
    { loanId: loan.id, amount: 3000 },
    { loanId: "another-loan", amount: 5000 }
  ];
  const balance = getLoanBalance(loan, repayments, loan.id, new Date(2026, 9, 27));
  assert.equal(balance.principal, 10000);
  assert.equal(balance.interest, 1000);
  assert.equal(balance.totalDue, 11000);
  assert.equal(balance.repaid, 5500);
  assert.equal(balance.outstanding, 5500);
  assert.equal(balance.status, "Overdue");
  assert.equal(balance.isOverdue, true);
});

test("marks a fully repaid loan as paid and summarizes totals", () => {
  const paidLoan = { ...loan, id: "loan-2", interestRate: 0, dueDate: "2026-10-20" };
  const summary = summarizeLoans(
    [paidLoan],
    [{ loanId: "loan-2", amount: 10000 }],
    new Date(2026, 9, 27)
  );
  assert.deepEqual(summary, {
    principal: 10000,
    totalDue: 10000,
    repaid: 10000,
    outstanding: 0,
    overdue: 0,
    paid: 1
  });
});

test("reports upcoming due dates without marking them overdue", () => {
  const balance = getLoanBalance(
    { ...loan, dueDate: "2026-10-30" },
    [],
    loan.id,
    new Date(2026, 9, 27)
  );
  assert.equal(balance.status, "Due in 3 days");
  assert.equal(balance.isOverdue, false);
});
