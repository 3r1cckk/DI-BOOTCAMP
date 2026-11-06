import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getContributionHealth,
  getMonthlyFinancialSeries
} from "../dashboard-analytics.js";

test("builds a six-month income, contribution, expense, and cash-flow series", () => {
  const series = getMonthlyFinancialSeries(
    [
      { member: "Amina", amount: 800, date: "2026-10-10T12:00:00.000Z" },
      { member: "Amina", amount: 600, date: "2026-09-10T12:00:00.000Z" }
    ],
    [
      { type: "income", amount: 1000, date: "2026-10-10T12:00:00.000Z" },
      { type: "expense", amount: 300, date: "2026-10-11T12:00:00.000Z" },
      { type: "income", amount: 700, date: "2026-09-10T12:00:00.000Z" }
    ],
    new Date(2026, 9, 27)
  );
  assert.equal(series.length, 6);
  assert.deepEqual(series.at(-1), {
    year: 2026,
    month: 9,
    label: "Oct",
    contributions: 800,
    otherIncome: 200,
    expenses: 300,
    netCashFlow: 700
  });
  assert.equal(series.at(-2).contributions, 600);
});

test("summarizes monthly pledge completion and overdue contributions", () => {
  const health = getContributionHealth(
    [
      { id: "paid", name: "Paid member", monthlyPledge: 1000 },
      { id: "late", name: "Late member", monthlyPledge: 500 },
      { id: "none", name: "No pledge", monthlyPledge: 0 }
    ],
    [{
      memberId: "paid",
      member: "Paid member",
      amount: 1000,
      date: "2026-10-05T12:00:00.000Z"
    }],
    20,
    new Date(2026, 9, 27)
  );
  assert.deepEqual(health, {
    pledgedMembers: 2,
    paidMembers: 1,
    outstandingMembers: 1,
    overdueMembers: 1,
    pledgedAmount: 1500,
    receivedAmount: 1000,
    outstandingAmount: 500,
    collectionRate: 1000 / 1500 * 100
  });
});
