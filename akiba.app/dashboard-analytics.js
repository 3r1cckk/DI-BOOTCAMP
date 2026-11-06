import { getMonthlyContributionStatus } from "./contribution-reminders.js";

export function getMonthlyFinancialSeries(contributions, transactions, now = new Date(), monthCount = 6) {
  return Array.from({ length: monthCount }, (_, index) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthCount + index + 1, 1);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const monthContributions = contributions
      .filter((contribution) => {
        const date = new Date(contribution.date);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .reduce((total, contribution) => total + contribution.amount, 0);
    const monthTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    const income = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      year,
      month,
      label: new Intl.DateTimeFormat("en-KE", { month: "short" }).format(monthStart),
      contributions: monthContributions,
      otherIncome: Math.max(0, income - monthContributions),
      expenses,
      netCashFlow: income - expenses
    };
  });
}

export function getContributionHealth(members, contributions, dueDay, now = new Date()) {
  const statuses = members
    .map((member) => getMonthlyContributionStatus(member, contributions, dueDay, now))
    .filter((status) => status.pledge > 0);
  const pledgedAmount = statuses.reduce((total, status) => total + status.pledge, 0);
  const receivedAmount = statuses.reduce((total, status) => total + status.received, 0);
  const outstandingAmount = statuses.reduce((total, status) => total + status.outstanding, 0);
  const paidMembers = statuses.filter((status) => status.outstanding === 0).length;
  const overdueMembers = statuses.filter((status) => status.isOverdue).length;

  return {
    pledgedMembers: statuses.length,
    paidMembers,
    outstandingMembers: statuses.filter((status) => status.outstanding > 0).length,
    overdueMembers,
    pledgedAmount,
    receivedAmount,
    outstandingAmount,
    collectionRate: pledgedAmount > 0
      ? Math.min(100, receivedAmount / pledgedAmount * 100)
      : 0
  };
}
