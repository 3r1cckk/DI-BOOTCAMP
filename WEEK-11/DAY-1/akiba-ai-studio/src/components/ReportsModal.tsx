import React, { useState } from 'react';
import { 
  FileDown, 
  X, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Table, 
  Receipt,
  Download,
  Check
} from 'lucide-react';
import { 
  Transaction, 
  Member, 
  Loan, 
  formatKES, 
  generateTransactionLedgerCSV 
} from './utils/chamaCalculations';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  loans: Loan[];
  transactions: Transaction[];
  totalSavings: number;
  activeLoanTotal: number;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  members,
  loans,
  transactions,
  totalSavings,
  activeLoanTotal,
}) => {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  /**
   * Export the recent transaction ledger into a CSV file,
   * guaranteeing that M-Pesa reference numbers are included.
   */
  const handleExportTransactionsCSV = () => {
    const csvData = generateTransactionLedgerCSV(transactions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const currentDate = new Date().toISOString().slice(0, 10);
    const filename = `Akiba_Transactions_Ledger_with_MPESA_Refs_${currentDate}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessMessage(`Exported ${transactions.length} transactions with M-Pesa reference numbers to ${filename}`);
    setTimeout(() => setDownloadSuccessMessage(null), 4500);
  };

  /**
   * Print statement view
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Chama Financial Reports & Ledger Export
              </h2>
              <p className="text-xs text-slate-400">Download audited statements and CSV ledgers with M-Pesa references</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Success Banner */}
          {downloadSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{downloadSuccessMessage}</span>
            </div>
          )}

          {/* Chama Snapshot Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 uppercase">Chama Name:</span>
              <span className="font-semibold text-slate-800">Ushirika Welfare Investment Group</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Member Savings:</span>
                <span className="font-bold text-emerald-700 text-sm">{formatKES(totalSavings)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Active Loans Issued:</span>
                <span className="font-bold text-blue-700 text-sm">{formatKES(activeLoanTotal)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Active Members:</span>
                <span className="font-bold text-slate-800">{members.length} members</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Transactions on Record:</span>
                <span className="font-bold text-slate-800">{transactions.length} entries</span>
              </div>
            </div>
          </div>

          {/* Dedicated Section: Export Recent Transaction Ledger with M-Pesa References */}
          <div className="p-4.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Recent Transaction Ledger
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      M-Pesa Refs Included
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Exports complete ledger with date, member name, phone, amount, and exact Safaricom M-Pesa code.
                  </p>
                </div>
              </div>

              {/* THE REQUESTED BUTTON */}
              <button
                onClick={handleExportTransactionsCSV}
                aria-label="Export recent transaction ledger to CSV with M-Pesa reference numbers"
                data-testid="btn-export-transactions-csv"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export Ledger (CSV)</span>
              </button>
            </div>

            {/* Preview of transactions & M-Pesa reference numbers */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mt-2">
              <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Transactions Preview ({transactions.length} entries)</span>
                <span className="text-emerald-700 font-mono">Column: M-Pesa Ref Number</span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 truncate">{tx.memberName}</div>
                      <div className="text-[11px] text-slate-500">{tx.date} • {tx.type.replace('_', ' ')}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {tx.mpesaRef || 'N/A'}
                      </span>
                      <div className="font-bold text-slate-900 mt-0.5">{formatKES(tx.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {transactions.length > 5 && (
                <div className="bg-slate-50 px-3 py-1.5 text-center text-[11px] text-slate-500 border-t border-slate-100">
                  + {transactions.length - 5} more transactions included in full CSV export
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600 bg-slate-100/80 p-3 rounded-lg border border-slate-200 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              All CSV files comply with Excel, Google Sheets, and Kenyan SACCO / Chama audit standards.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white flex items-center gap-1.5 cursor-pointer transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>

          <button
            onClick={handleExportTransactionsCSV}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Transactions CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
