import React from 'react';
import { 
  CreditCard, 
  HandCoins, 
  CheckCircle2, 
  UserPlus, 
  Smartphone, 
  FileDown, 
  ArrowRight 
} from 'lucide-react';

interface QuickActionCardsProps {
  onOpenRecordContribution: () => void;
  onOpenRequestLoan: () => void;
  onOpenApproveLoans: () => void;
  onOpenAddMember: () => void;
  onOpenMpesaSimulator: () => void;
  onOpenExportReports: () => void;
  pendingLoanCount: number;
}

export const QuickActionCards: React.FC<QuickActionCardsProps> = ({
  onOpenRecordContribution,
  onOpenRequestLoan,
  onOpenApproveLoans,
  onOpenAddMember,
  onOpenMpesaSimulator,
  onOpenExportReports,
  pendingLoanCount,
}) => {
  const actions = [
    {
      id: 'record-contribution',
      title: 'Record Contribution',
      subtitle: 'Log monthly shares, welfare, or merry-go-round',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:border-emerald-400',
      iconBg: 'bg-emerald-600 text-white',
      badge: null,
      onClick: onOpenRecordContribution,
      ariaLabel: 'Open record contribution modal',
    },
    {
      id: 'request-loan',
      title: 'Request / Issue Loan',
      subtitle: 'Apply with interest rate & guarantor rules',
      icon: HandCoins,
      color: 'bg-blue-50 text-blue-700 border-blue-200 group-hover:border-blue-400',
      iconBg: 'bg-blue-600 text-white',
      badge: null,
      onClick: onOpenRequestLoan,
      ariaLabel: 'Open request loan modal',
    },
    {
      id: 'approve-loans',
      title: 'Approve / Review Loans',
      subtitle: 'Treasurer & Chairman sign-off on requests',
      icon: CheckCircle2,
      color: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:border-amber-400',
      iconBg: 'bg-amber-600 text-white',
      badge: pendingLoanCount > 0 ? `${pendingLoanCount} Pending` : null,
      onClick: onOpenApproveLoans,
      ariaLabel: 'Open approve loans modal',
    },
    {
      id: 'add-member',
      title: 'Add New Member',
      subtitle: 'Register new member with phone & monthly pledge',
      icon: UserPlus,
      color: 'bg-purple-50 text-purple-700 border-purple-200 group-hover:border-purple-400',
      iconBg: 'bg-purple-600 text-white',
      badge: null,
      onClick: onOpenAddMember,
      ariaLabel: 'Open add new member modal',
    },
    {
      id: 'mpesa-simulator',
      title: 'M-Pesa STK Simulator',
      subtitle: 'Test Daraja STK Push prompt without Paybill',
      icon: Smartphone,
      color: 'bg-teal-50 text-teal-800 border-teal-200 group-hover:border-teal-400',
      iconBg: 'bg-emerald-600 text-white',
      badge: 'Interactive Sandbox',
      onClick: onOpenMpesaSimulator,
      ariaLabel: 'Open M-Pesa STK simulator modal',
    },
    {
      id: 'export-reports',
      title: 'Generate Statements',
      subtitle: 'Export monthly Chama balance sheet & records',
      icon: FileDown,
      color: 'bg-slate-50 text-slate-700 border-slate-200 group-hover:border-slate-400',
      iconBg: 'bg-slate-700 text-white',
      badge: null,
      onClick: onOpenExportReports,
      ariaLabel: 'Open export reports modal',
    },
  ];

  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="quick-actions-heading" className="text-base font-bold text-slate-900 tracking-tight">
          Quick Actions
        </h2>
        <span className="text-xs text-slate-500">6 common Chama operations</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              aria-label={action.ariaLabel}
              data-testid={`action-card-${action.id}`}
              className={`action-card group p-4 rounded-xl border text-left transition-all duration-200 bg-white hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${action.color}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${action.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {action.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-800 border border-current shadow-2xs">
                    {action.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between group-hover:text-blue-600 transition-colors">
                  <span>{action.title}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-blue-600" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {action.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
