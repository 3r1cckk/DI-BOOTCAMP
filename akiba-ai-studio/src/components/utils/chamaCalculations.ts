/**
 * Chama Financial and Calculation Utilities
 * Standardized logic for Kenyan Chamas (Savings, Loans, Interest, Compliance, M-Pesa)
 */

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  type: 'contribution' | 'loan_disbursement' | 'loan_repayment' | 'welfare' | 'fine';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: 'mpesa' | 'bank_transfer' | 'cash';
  mpesaRef?: string;
  notes?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  role: 'member' | 'treasurer' | 'secretary' | 'chairperson' | 'admin';
  joinedDate: string;
  totalSaved: number;
  monthlyPledge: number;
  status: 'active' | 'pending' | 'rejected' | 'inactive';
  activeLoanAmount: number;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  interestRate: number; // in percentage e.g. 10%
  durationMonths: number;
  startDate: string;
  dueDate: string;
  monthlyInstallment: number;
  totalRepayment: number;
  amountRepaid: number;
  guarantorName: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
}

/**
 * Calculates total savings from active members or transactions
 */
export function calculateTotalSavings(members: Member[]): number {
  return members.reduce((sum, member) => sum + (member.totalSaved || 0), 0);
}

/**
 * Calculates total active loans issued
 */
export function calculateActiveLoanTotal(loans: Loan[]): number {
  return loans
    .filter((l) => l.status === 'active' || l.status === 'approved')
    .reduce((sum, loan) => sum + (loan.amount || 0), 0);
}

/**
 * Calculates pending loan repayments (total repayment remaining)
 */
export function calculatePendingRepayments(loans: Loan[]): number {
  return loans
    .filter((l) => l.status === 'active')
    .reduce((sum, loan) => sum + Math.max(0, loan.totalRepayment - loan.amountRepaid), 0);
}

/**
 * Standard Chama Loan Interest Calculator
 * @param principal Loan principal amount in KES
 * @param interestRate Annual or cycle interest percentage (e.g. 10%)
 * @param durationMonths Loan duration in months
 * @returns Total interest, total repayment, and monthly installment
 */
export function calculateChamaLoan(
  principal: number,
  interestRate: number,
  durationMonths: number
): {
  interestAmount: number;
  totalRepayment: number;
  monthlyInstallment: number;
} {
  if (principal <= 0 || durationMonths <= 0) {
    return { interestAmount: 0, totalRepayment: 0, monthlyInstallment: 0 };
  }
  const interestAmount = Math.round((principal * (interestRate / 100)));
  const totalRepayment = principal + interestAmount;
  const monthlyInstallment = Math.round(totalRepayment / durationMonths);

  return {
    interestAmount,
    totalRepayment,
    monthlyInstallment,
  };
}

/**
 * Generates simulated Daraja / Safaricom M-Pesa Receipt Code (e.g., QHK9832BXZ)
 */
export function generateMpesaReceipt(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '0123456789';
  let code = 'Q';
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

/**
 * Calculates chama contribution compliance rate for current cycle
 */
export function calculateContributionCompliance(
  members: Member[],
  actualTotalThisMonth: number
): number {
  const totalExpected = members.reduce((sum, m) => sum + (m.monthlyPledge || 0), 0);
  if (totalExpected === 0) return 100;
  const rate = Math.round((actualTotalThisMonth / totalExpected) * 100);
  return Math.min(100, Math.max(0, rate));
}

/**
 * Formats Kenyan Shillings with KES prefix and commas
 */
export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Generates structured CSV string for the Chama Transaction Ledger,
 * explicitly guaranteeing M-Pesa Reference Codes are included in column 8.
 */
export function generateTransactionLedgerCSV(transactions: Transaction[]): string {
  const headers = [
    'Transaction ID',
    'Member Name',
    'Phone Number',
    'Transaction Type',
    'Amount (KES)',
    'Date & Time',
    'Payment Method',
    'M-Pesa Reference Number',
    'Notes'
  ];

  const escapeCSV = (field: string | number | undefined | null) => {
    if (field === undefined || field === null) return '""';
    const stringField = String(field);
    return `"${stringField.replace(/"/g, '""')}"`;
  };

  const rows = transactions.map((tx) => [
    escapeCSV(tx.id),
    escapeCSV(tx.memberName),
    escapeCSV(tx.phone),
    escapeCSV(tx.type.replace('_', ' ').toUpperCase()),
    escapeCSV(tx.amount),
    escapeCSV(tx.date),
    escapeCSV(tx.paymentMethod.toUpperCase()),
    escapeCSV(tx.mpesaRef || 'N/A'),
    escapeCSV(tx.notes || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
