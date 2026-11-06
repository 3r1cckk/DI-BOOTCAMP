import React from 'react';
import { PiggyBank, HandCoins, ClockAlert, TrendingUp, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { formatKES } from '../utils/chamaCalculations';

interface FinancialSummaryCardsProps {
  totalSavings: number;
  activeLoanTotal: number;
  pendingRepayments: number;
  monthlyContributions: number;
  monthlyTarget: number;
  complianceRate: number;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  totalSavings,
  activeLoanTotal,
  pendingRepayments,
  monthlyContributions,
  monthlyTarget,
  complianceRate,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Total Chama Savings */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Chama Savings
          </span>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatKES(totalSavings)}
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="text-emerald-600 font-semibold flex items-center gap-0.5 mr-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
          </span>
          <span>vs last cycle (14 active savers)</span>
        </div>
      </div>

      {/* Card 2: Total Active Loans */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Loans Issued
          </span>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <HandCoins className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatKES(activeLoanTotal)}
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="text-blue-600 font-semibold mr-1.5">
            10% Flat Rate
          </span>
          <span>across active member loans</span>
        </div>
      </div>

      {/* Card 3: Pending Repayments */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending Repayments
          </span>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ClockAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-600 tracking-tight">
          {formatKES(pendingRepayments)}
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="text-amber-700 font-medium">
            Due in 10 days
          </span>
          <span className="mx-1">•</span>
          <span>2 pending loan reviews</span>
        </div>
      </div>

      {/* Card 4: Monthly Contributions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Monthly Contributions
          </span>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatKES(monthlyContributions)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Target: {formatKES(monthlyTarget)}</span>
          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {complianceRate}% Target
          </span>
        </div>
      </div>
    </div>
  );
};
