function roundCurrency(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function getLoanBalance(loan, repayments, loanId, now = new Date()) {
  const principal = Number(loan.amount) || 0;
  const interestRate = Number(loan.interestRate) || 0;
  const totalDue = roundCurrency(principal * (1 + interestRate / 100));
  const repaid = roundCurrency(repayments
    .filter((repayment) => repayment.loanId === loanId)
    .reduce((total, repayment) => total + repayment.amount, 0));
  const outstanding = Math.max(0, roundCurrency(totalDue - repaid));
  const dueKey = String(loan.dueDate || "").slice(0, 10);
  const todayKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  const isOverdue = outstanding > 0 && dueKey < todayKey;
  let status = "Open";

  if (outstanding <= 0) status = "Paid";
  else if (isOverdue) status = "Overdue";
  else if (dueKey === todayKey) status = "Due today";
  else if (dueKey > todayKey) {
    const [year, month, day] = dueKey.split("-").map(Number);
    const daysUntilDue = Math.round(
      (Date.UTC(year, month - 1, day) -
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000
    );
    if (daysUntilDue <= 7) status = `Due in ${daysUntilDue} ${daysUntilDue === 1 ? "day" : "days"}`;
  }

  return {
    principal: roundCurrency(principal),
    interestRate,
    interest: roundCurrency(totalDue - principal),
    totalDue,
    repaid,
    outstanding,
    isOverdue,
    status
  };
}

export function summarizeLoans(loans, repayments, now = new Date()) {
  return loans.reduce((summary, loan, index) => {
    const loanId = loan.id || `legacy-${index}`;
    const balance = getLoanBalance(loan, repayments, loanId, now);
    summary.principal += balance.principal;
    summary.totalDue += balance.totalDue;
    summary.repaid += balance.repaid;
    summary.outstanding += balance.outstanding;
    if (balance.isOverdue) summary.overdue += 1;
    if (balance.outstanding <= 0) summary.paid += 1;
    return summary;
  }, { principal: 0, totalDue: 0, repaid: 0, outstanding: 0, overdue: 0, paid: 0 });
}
