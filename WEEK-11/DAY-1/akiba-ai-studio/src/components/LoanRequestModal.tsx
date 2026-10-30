import React, { useState } from 'react';
import { HandCoins, X, Calculator, ShieldCheck } from 'lucide-react';
import { Member, calculateChamaLoan, formatKES } from './utils/chamaCalculations';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onRequestLoan: (data: {
    memberId: string;
    memberName: string;
    amount: number;
    interestRate: number;
    durationMonths: number;
    guarantorName: string;
  }) => void;
}

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  isOpen,
  onClose,
  members,
  onRequestLoan,
}) => {
  const [memberId, setMemberId] = useState<string>(members[0]?.id || '');
  const [amount, setAmount] = useState<number>(40000);
  const [interestRate, setInterestRate] = useState<number>(10);
  const [durationMonths, setDurationMonths] = useState<number>(4);
  const [guarantorName, setGuarantorName] = useState<string>(members[1]?.name || '');

  if (!isOpen) return null;

  const loanCalc = calculateChamaLoan(amount, interestRate, durationMonths);
  const selectedMember = members.find((m) => m.id === memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    onRequestLoan({
      memberId,
      memberName: selectedMember.name,
      amount: Number(amount),
      interestRate: Number(interestRate),
      durationMonths: Number(durationMonths),
      guarantorName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Apply for Chama Loan</h2>
              <p className="text-xs text-slate-500">Calculate repayment & assign guarantor</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Borrowing Member
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              {members.length === 0 && <option value="">Add a member before requesting a loan</option>}
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Savings: {formatKES(m.totalSaved)})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Chama rule: Loan eligibility up to 3x member total savings ({formatKES((selectedMember?.totalSaved || 0) * 3)} max).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Loan Principal (KES)
              </label>
              <input
                type="number"
                min="5000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Duration (Months)
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value={1}>1 Month</option>
                <option value={2}>2 Months</option>
                <option value={3}>3 Months</option>
                <option value={4}>4 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Interest Rate (% Flat)
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 12].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setInterestRate(rate)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                    interestRate === rate
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Calculator summary card */}
          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 font-semibold uppercase text-[10px]">
              <span className="flex items-center gap-1">
                <Calculator className="w-3 h-3 text-blue-400" /> Repayment Schedule
              </span>
              <span>{interestRate}% Interest</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>Chama Interest Gain:</span>
              <span className="text-emerald-400 font-bold">+{formatKES(loanCalc.interestAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span>Total Repayable:</span>
              <span className="text-white font-bold">{formatKES(loanCalc.totalRepayment)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-300 font-medium">Monthly Installment:</span>
              <span className="text-amber-400 font-mono font-bold text-sm">
                {formatKES(loanCalc.monthlyInstallment)} / mo
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Guarantor Member
            </label>
            <select
              value={guarantorName}
              onChange={(e) => setGuarantorName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              {members.filter((m) => m.id !== memberId).length === 0 && (
                <option value="">Add another member as guarantor</option>
              )}
              {members
                .filter((m) => m.id !== memberId)
                .map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedMember}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Loan Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
