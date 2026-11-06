import React, { useState } from 'react';
import { CreditCard, X, Check, Building2, Smartphone, Banknote } from 'lucide-react';
import { Member, generateMpesaReceipt, formatKES } from './utils/chamaCalculations';

interface RecordContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddContribution: (data: {
    memberId: string;
    memberName: string;
    phone: string;
    type: 'contribution' | 'welfare';
    amount: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'cash';
    mpesaRef: string;
    notes: string;
  }) => void;
}

export const RecordContributionModal: React.FC<RecordContributionModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddContribution,
}) => {
  const [memberId, setMemberId] = useState<string>(members[0]?.id || '');
  const [amount, setAmount] = useState<number>(5000);
  const [contributionType, setContributionType] = useState<'contribution' | 'welfare'>('contribution');
  const [method, setMethod] = useState<'mpesa' | 'bank_transfer' | 'cash'>('mpesa');
  const [reference, setReference] = useState<string>(generateMpesaReceipt());
  const [notes, setNotes] = useState<string>('Monthly contribution share');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = members.find((m) => m.id === memberId);
    if (!selected) return;

    onAddContribution({
      memberId,
      memberName: selected.name,
      phone: selected.phone,
      type: contributionType,
      amount: Number(amount),
      paymentMethod: method,
      mpesaRef: reference,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Contribution</h2>
              <p className="text-xs text-slate-500">Log incoming Chama member savings</p>
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
              Select Member
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} - Pledge: {formatKES(m.monthlyPledge)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Amount (KES)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Fund Category
              </label>
              <select
                value={contributionType}
                onChange={(e) => setContributionType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value="contribution">Monthly Shares</option>
                <option value="welfare">Emergency Welfare</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                { id: 'cash', label: 'Cash', icon: Banknote },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m.id as any);
                      if (m.id === 'mpesa') setReference(generateMpesaReceipt());
                      if (m.id === 'bank_transfer') setReference('BK-' + Math.floor(100000 + Math.random() * 900000));
                      if (m.id === 'cash') setReference('CSH-' + Math.floor(1000 + Math.random() * 9000));
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      method === m.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reference Code
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:ring-2 focus:ring-blue-600"
              required
            />
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
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
