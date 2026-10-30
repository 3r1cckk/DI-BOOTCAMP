import React from 'react';
import { CheckCircle2, X, AlertTriangle, ShieldCheck, Check, Ban } from 'lucide-react';
import { Loan, formatKES } from './utils/chamaCalculations';

interface LoanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingLoans: Loan[];
  onApproveLoan: (loanId: string) => void;
  onRejectLoan: (loanId: string) => void;
}

export const LoanApprovalModal: React.FC<LoanApprovalModalProps> = ({
  isOpen,
  onClose,
  pendingLoans,
  onApproveLoan,
  onRejectLoan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Review & Approve Loans</h2>
              <p className="text-xs text-slate-500">Official Chama Executive authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[480px] overflow-y-auto">
          {pendingLoans.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-bold text-slate-800">All Loan Requests Cleared!</p>
              <p className="text-xs text-slate-400 mt-1">There are no pending loan applications right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                The following loans require Treasurer and Chairman dual-approval before disbursement:
              </p>

              {pendingLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{loan.memberName}</h3>
                      <p className="text-xs text-slate-500">
                        Guarantor: <strong className="text-slate-700">{loan.guarantorName}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-blue-700">{formatKES(loan.amount)}</p>
                      <p className="text-[11px] text-slate-500">{loan.durationMonths} months @ {loan.interestRate}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">TOTAL REPAYABLE:</span>
                      <span className="font-bold text-slate-800">{formatKES(loan.totalRepayment)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">MONTHLY INSTALLMENT:</span>
                      <span className="font-mono font-bold text-amber-700">{formatKES(loan.monthlyInstallment)} / mo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onRejectLoan(loan.id)}
                      className="flex-1 py-2 px-3 rounded-lg border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      onClick={() => onApproveLoan(loan.id)}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Disburse</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
