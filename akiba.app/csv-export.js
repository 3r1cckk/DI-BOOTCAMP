import { getMonthlyFinancialSeries } from "./dashboard-analytics.js";
import { getLoanBalance, summarizeLoans } from "./loan-tracking.js";

function csvCell(value) {
  let text = String(value ?? "");
  const firstText = text.search(/\S/);
  if (typeof value !== "number" && firstText >= 0 && /^[=+\-@]/.test(text[firstText])) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

function safeFilenamePart(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "akiba";
}

export function buildWorkspaceCsv(page, data, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const chama = safeFilenamePart(data.settings?.chamaName);
  let headers;
  let rows;

  if (page === "Contributions") {
    headers = [
      "Member",
      "Amount (KES)",
      "Date",
      "Payment method",
      "Receipt number",
      "M-Pesa checkout request ID"
    ];
    rows = data.contributions.map((item) => [
      item.member,
      item.amount,
      item.date,
      item.paymentMethod || "Cash / other",
      item.receiptNumber || "",
      item.checkoutRequestId || ""
    ]);
  } else if (page === "Loans") {
    headers = [
      "Record type",
      "Loan ID",
      "Borrower",
      "Amount (KES)",
      "Interest rate (%)",
      "Date",
      "Total due (KES)",
      "Outstanding (KES)",
      "Status"
    ];
    rows = data.loans.flatMap((loan, index) => {
      const loanId = loan.id || `legacy-${index}`;
      const balance = getLoanBalance(loan, data.loanRepayments, loanId, now);
      const loanRow = [[
        "Loan",
        loanId,
        loan.borrower,
        loan.amount,
        balance.interestRate,
        loan.issuedAt || "",
        balance.totalDue,
        balance.outstanding,
        balance.status
      ]];
      const repayments = data.loanRepayments
        .filter((repayment) => repayment.loanId === loanId)
        .map((repayment) => [
          "Repayment",
          loanId,
          loan.borrower,
          repayment.amount,
          "",
          repayment.date,
          "",
          "",
          ""
        ]);
      return [...loanRow, ...repayments];
    });
  } else if (page === "Transactions") {
    headers = ["Description", "Type", "Amount (KES)", "Date"];
    rows = data.transactions.map((item) => [
      item.description,
      item.type,
      item.amount,
      item.date
    ]);
  } else if (page === "Reports") {
    headers = ["Section", "Period", "Metric", "Amount (KES)"];
    const contributions = data.contributions.reduce((sum, item) => sum + item.amount, 0);
    const income = data.transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = data.transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const loans = summarizeLoans(data.loans, data.loanRepayments, now);
    const monthlySeries = getMonthlyFinancialSeries(data.contributions, data.transactions, now);
    rows = [
      ["Summary", "All time", "Contributions", contributions],
      ["Summary", "All time", "Other income", Math.max(0, income - contributions)],
      ["Summary", "All time", "Expenses", expenses],
      ["Summary", "All time", "Available balance", income - expenses],
      ["Summary", "All time", "Loan principal issued", loans.principal],
      ["Summary", "All time", "Loan repayments received", loans.repaid],
      ["Summary", "All time", "Outstanding loan balance", loans.outstanding],
      ...monthlySeries.flatMap((month) => [
        ["Monthly", `${month.year}-${String(month.month + 1).padStart(2, "0")}`, "Contributions", month.contributions],
        ["Monthly", `${month.year}-${String(month.month + 1).padStart(2, "0")}`, "Other income", month.otherIncome],
        ["Monthly", `${month.year}-${String(month.month + 1).padStart(2, "0")}`, "Expenses", month.expenses],
        ["Monthly", `${month.year}-${String(month.month + 1).padStart(2, "0")}`, "Net cash flow", month.netCashFlow]
      ])
    ];
  } else {
    return null;
  }

  return {
    filename: `${chama}-${safeFilenamePart(page.toLowerCase())}-${date}.csv`,
    csv: toCsv([headers, ...rows])
  };
}
