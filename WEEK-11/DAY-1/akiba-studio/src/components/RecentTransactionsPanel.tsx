import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Smartphone, 
  Building2, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Filter,
  Search,
  Receipt
} from 'lucide-react';
import { Transaction, formatKES } from './utils/chamaCalculations';

interface RecentTransactionsPanelProps {
  transactions: Transaction[];
  searchQuery: string;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const RecentTransactionsPanel: React.FC<RecentTransactionsPanelProps> = ({
  transactions,
  searchQuery,
  onSelectTransaction,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = transactions.filter((tx) => {
    // Search query filter
    const matchesSearch =
      tx.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.phone.includes(searchQuery) ||
      (tx.mpesaRef && tx.mpesaRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery);

    // Type filter
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'contribution') return tx.type === 'contribution';
    if (filterType === 'loan') return tx.type === 'loan_disbursement' || tx.type === 'loan_repayment';
    if (filterType === 'welfare') return tx.type === 'welfare';
    return true;
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600" aria-label="M-Pesa" />;
      case 'bank_transfer':
        return <Building2 className="w-3.5 h-3.5 text-blue-600" aria-label="Bank Transfer" />;
      default:
        return <Banknote className="w-3.5 h-3.5 text-amber-600" aria-label="Cash" />;
    }
  };

  const getTypeBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'contribution':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Monthly Share
          </span>
        );
      case 'loan_disbursement':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Loan Issued
          </span>
        );
      case 'loan_repayment':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Repayment
          </span>
        );
      case 'welfare':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Welfare Fund
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Other
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Recent Transactions
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
              {filtered.length} entries
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time Chama financial ledger</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'contribution', label: 'Contributions' },
            { id: 'loan', label: 'Loans' },
            { id: 'welfare', label: 'Welfare' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                filterType === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              {transactions.length === 0 ? 'No transactions recorded yet.' : 'No transactions match your search.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {transactions.length === 0 ? 'Recorded contributions and loans will appear here.' : 'Try clearing your search query or filters.'}
            </p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isCredit = tx.type === 'contribution' || tx.type === 'loan_repayment' || tx.type === 'welfare';
            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction?.(tx)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {tx.memberName}
                      </p>
                      {getTypeBadge(tx.type)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        {getMethodIcon(tx.paymentMethod)}
                        {tx.mpesaRef || tx.phone}
                      </span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-bold tracking-tight ${
                      isCredit ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {isCredit ? '+' : '-'}{formatKES(tx.amount)}
                  </p>
                  <p className="text-[11px] text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
        <span>Transactions recorded by your chama appear here.</span>
      </div>
    </div>
  );
};
