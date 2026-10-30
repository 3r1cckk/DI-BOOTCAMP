import React from 'react';
import { 
  PieChart, 
  Users, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Gift,
  ArrowRight
} from 'lucide-react';
import { formatKES } from './utils/chamaCalculations';

interface MonthlySummaryPanelProps {
  monthlyTarget: number;
  monthlyCollected: number;
  activeMembersCount: number;
  paidMembersCount: number;
  onOpenRecordContribution: () => void;
}

export const MonthlySummaryPanel: React.FC<MonthlySummaryPanelProps> = ({
  monthlyTarget,
  monthlyCollected,
  activeMembersCount,
  paidMembersCount,
  onOpenRecordContribution,
}) => {
  const percentage = monthlyTarget > 0
    ? Math.min(100, Math.round((monthlyCollected / monthlyTarget) * 100))
    : 0;
  const pendingMembersCount = Math.max(0, activeMembersCount - paidMembersCount);

  // Distribution breakdown
  const fundAllocations = [
    { name: 'Core Savings / Investment Fund', share: '60%', amount: Math.round(monthlyCollected * 0.6), color: 'bg-blue-600' },
    { name: 'Merry-Go-Round (Table Banking)', share: '25%', amount: Math.round(monthlyCollected * 0.25), color: 'bg-emerald-500' },
    { name: 'Emergency & Welfare Kitty', share: '15%', amount: Math.round(monthlyCollected * 0.15), color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Monthly Summary
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
              {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Performance & Merry-Go-Round Rota</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Progress bar towards monthly target */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">Monthly Contribution Goal</span>
            <span className="font-bold text-slate-900">
              {percentage}% <span className="font-normal text-slate-500">({formatKES(monthlyCollected)} / {formatKES(monthlyTarget)})</span>
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              {paidMembersCount} members fully paid
            </span>
            {pendingMembersCount > 0 ? (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                {pendingMembersCount} members have not met their goal
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">
                {activeMembersCount === 0 ? 'No members to track yet' : 'All cleared!'}
              </span>
            )}
          </div>
        </div>

        {/* Merry-Go-Round Spotlight */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  This Month's Merry-Go-Round Turn
                </p>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">
                  No payout scheduled
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-white/80 px-2 py-1 rounded-md border border-emerald-300">
              {formatKES(0)}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2.5">
            Add your chama's payout schedule to see upcoming disbursements.
          </p>
        </div>

        {/* Fund Allocations */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Current Month Fund Allocation
          </h3>
          <div className="space-y-2.5">
            {fundAllocations.map((fund) => (
              <div key={fund.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${fund.color}`} />
                  <span className="text-slate-700 font-medium">{fund.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">{fund.share}</span>
                  <span className="font-semibold text-slate-900">{formatKES(fund.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nudge button */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-xl flex items-center justify-between">
        <span className="text-xs text-slate-600">Pending contributions?</span>
        <button
          onClick={onOpenRecordContribution}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Record payment now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
