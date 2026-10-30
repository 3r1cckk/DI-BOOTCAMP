import React from 'react';
import { HandCoins, Plus, CheckCircle2, Clock, Check, Ban } from 'lucide-react';
import { Loan, formatKES } from './utils/chamaCalculations';

interface LoansViewProps {
  loans: Loan[];
  onOpenRequestLoan: () => void;
  onOpenApproveLoans: () => void;
  pendingLoanCount: number;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  onOpenRequestLoan,
  onOpenApproveLoans,
  pendingLoanCount,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Loans & Repayments Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chama micro-lending portfolio, interest gains, and active guarantor records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingLoanCount > 0 && (
            <button
              onClick={onOpenApproveLoans}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Review ({pendingLoanCount}) Pending</span>
            </button>
          )}

          <button
            onClick={onOpenRequestLoan}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Loan</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Borrower</th>
                <th className="px-5 py-3.5">Guarantor</th>
                <th className="px-5 py-3.5">Principal</th>
                <th className="px-5 py-3.5">Total Due</th>
                <th className="px-5 py-3.5">Monthly Installment</th>
                <th className="px-5 py-3.5">Repaid</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={7}>
                    No loans recorded yet.
                  </td>
                </tr>
              ) : loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    {loan.memberName}
                    <div className="text-[10px] font-normal text-slate-400">Due {loan.dueDate}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {loan.guarantorName}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    {formatKES(loan.amount)}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-blue-700">
                    {formatKES(loan.totalRepayment)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-amber-700 font-semibold">
                    {formatKES(loan.monthlyInstallment)} / mo
                  </td>
                  <td className="px-5 py-3.5 font-mono text-emerald-700">
                    {formatKES(loan.amountRepaid)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                      loan.status === 'active'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : loan.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {loan.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
