import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalSavings,
  calculateActiveLoanTotal,
  calculatePendingRepayments,
  calculateChamaLoan,
  generateMpesaReceipt,
  calculateContributionCompliance,
  generateTransactionLedgerCSV,
  formatKES,
  Member,
  Loan,
  Transaction,
} from './chamaCalculations';

const dummyMembers: Member[] = [
  {
    id: 'm1',
    name: 'Faith Wanjiku',
    phone: '0712345678',
    email: 'faith@example.com',
    idNumber: '29384756',
    role: 'chairperson',
    joinedDate: '2023-01-15',
    totalSaved: 150000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm2',
    name: 'Brian Kiprop',
    phone: '0723456789',
    email: 'brian@example.com',
    idNumber: '31284950',
    role: 'treasurer',
    joinedDate: '2023-02-10',
    totalSaved: 120000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 40000,
  },
];

const dummyLoans: Loan[] = [
  {
    id: 'l1',
    memberId: 'm2',
    memberName: 'Brian Kiprop',
    amount: 50000,
    interestRate: 10,
    durationMonths: 5,
    startDate: '2024-01-01',
    dueDate: '2024-06-01',
    monthlyInstallment: 11000,
    totalRepayment: 55000,
    amountRepaid: 22000,
    guarantorName: 'Faith Wanjiku',
    status: 'active',
  },
  {
    id: 'l2',
    memberId: 'm3',
    memberName: 'Kevin Omondi',
    amount: 30000,
    interestRate: 10,
    durationMonths: 3,
    startDate: '2023-10-01',
    dueDate: '2024-01-01',
    monthlyInstallment: 11000,
    totalRepayment: 33000,
    amountRepaid: 33000,
    guarantorName: 'Brian Kiprop',
    status: 'completed',
  },
];

test('calculateTotalSavings sums member savings accurately', () => {
  const total = calculateTotalSavings(dummyMembers);
  assert.equal(total, 270000);
});

test('calculateActiveLoanTotal calculates only active loans', () => {
  const activeTotal = calculateActiveLoanTotal(dummyLoans);
  assert.equal(activeTotal, 50000);
});

test('calculatePendingRepayments computes remaining balance', () => {
  const pending = calculatePendingRepayments(dummyLoans);
  assert.equal(pending, 33000); // 55000 - 22000 = 33000
});

test('calculateChamaLoan calculates standard interest and monthly installment', () => {
  const result = calculateChamaLoan(100000, 10, 5);
  assert.equal(result.interestAmount, 10000);
  assert.equal(result.totalRepayment, 110000);
  assert.equal(result.monthlyInstallment, 22000);
});

test('generateMpesaReceipt generates Safaricom format code', () => {
  const receipt = generateMpesaReceipt();
  assert.equal(receipt.startsWith('Q'), true);
  assert.equal(receipt.length, 10);
});

test('calculateContributionCompliance returns correct percentage', () => {
  // total expected = 20,000. actual = 18,000 => 90%
  const rate = calculateContributionCompliance(dummyMembers, 18000);
  assert.equal(rate, 90);
});

test('formatKES formats Kenyan Shillings with prefix', () => {
  assert.equal(formatKES(50000), 'KES 50,000');
});

test('generateTransactionLedgerCSV exports ledger with M-Pesa Reference Numbers', () => {
  const dummyTx: Transaction[] = [
    {
      id: 'tx-001',
      memberId: 'm1',
      memberName: 'Faith Wanjiku',
      phone: '0712345678',
      type: 'contribution',
      amount: 10000,
      date: '2026-10-22 14:32',
      status: 'completed',
      paymentMethod: 'mpesa',
      mpesaRef: 'QHK9824XJ7',
      notes: 'Monthly share payment'
    },
    {
      id: 'tx-002',
      memberId: 'm2',
      memberName: 'Brian Kiprop',
      phone: '0722334455',
      type: 'loan_repayment',
      amount: 11000,
      date: '2026-10-21 16:45',
      status: 'completed',
      paymentMethod: 'mpesa',
      mpesaRef: 'QHM3910KLP',
      notes: 'Installment 2'
    }
  ];

  const csv = generateTransactionLedgerCSV(dummyTx);
  // Check headers include M-Pesa Reference Number
  assert.equal(csv.includes('M-Pesa Reference Number'), true);
  // Check rows include the M-Pesa reference codes
  assert.equal(csv.includes('QHK9824XJ7'), true);
  assert.equal(csv.includes('QHM3910KLP'), true);
  assert.equal(csv.includes('"Faith Wanjiku"'), true);
  assert.equal(csv.includes('"CONTRIBUTION"'), true);
});
