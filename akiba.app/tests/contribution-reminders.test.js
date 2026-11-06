import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDueDay,
  getMonthlyContributionStatus,
  summarizeContributionReminders
} from "../contribution-reminders.js";

const member = { id: "member-1", name: "Amina", monthlyPledge: 1000 };

test("tracks payment amounts and labels upcoming, due, and overdue pledges", () => {
  const contributions = [{
    memberId: member.id,
    member: member.name,
    amount: 400,
    date: "2026-10-01T10:00:00.000Z"
  }];
  const beforeDue = getMonthlyContributionStatus(
    member,
    contributions,
    20,
    new Date(2026, 9, 18)
  );
  assert.equal(beforeDue.received, 400);
  assert.equal(beforeDue.outstanding, 600);
  assert.equal(beforeDue.status, "Partially paid · due in 2 days");
  assert.equal(beforeDue.state, "due-soon");

  const dueToday = getMonthlyContributionStatus(
    member,
    [],
    20,
    new Date(2026, 9, 20)
  );
  assert.equal(dueToday.status, "Due today");
  assert.equal(dueToday.state, "due-today");

  const overdue = getMonthlyContributionStatus(
    member,
    contributions,
    20,
    new Date(2026, 9, 21)
  );
  assert.equal(overdue.status, "Partially overdue");
  assert.equal(overdue.isOverdue, true);
});

test("matches contributions by member id and summarizes outstanding totals", () => {
  const anotherMember = { id: "member-2", name: "Brian", monthlyPledge: 500 };
  const contributions = [
    { memberId: member.id, member: member.name, amount: 1000, date: "2026-10-02T10:00:00.000Z" },
    { memberId: anotherMember.id, member: anotherMember.name, amount: 200, date: "2026-10-03T10:00:00.000Z" },
    { memberId: anotherMember.id, member: anotherMember.name, amount: 500, date: "2026-09-03T10:00:00.000Z" }
  ];
  const summary = summarizeContributionReminders(
    [member, anotherMember],
    contributions,
    25,
    new Date(2026, 9, 24)
  );
  assert.deepEqual(summary, {
    outstanding: 1,
    outstandingAmount: 300,
    overdue: 0,
    dueSoon: 1
  });
});

test("formats contribution due-day suffixes correctly", () => {
  assert.equal(formatDueDay(1), "1st");
  assert.equal(formatDueDay(12), "12th");
  assert.equal(formatDueDay(23), "23rd");
});
