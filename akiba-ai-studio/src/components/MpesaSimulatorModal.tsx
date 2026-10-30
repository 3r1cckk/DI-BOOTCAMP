import React, { useState } from 'react';
import { 
  Smartphone, 
  X, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Member, generateMpesaReceipt, formatKES } from './utils/chamaCalculations';

interface MpesaSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSuccessfulPayment: (data: {
    memberId: string;
    memberName: string;
    phone: string;
    amount: number;
    type: 'contribution' | 'loan_repayment' | 'welfare';
    mpesaRef: string;
  }) => void;
}

export const MpesaSimulatorModal: React.FC<MpesaSimulatorModalProps> = ({
  isOpen,
  onClose,
  members,
  onSuccessfulPayment,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(members[0]?.phone || '0712345678');
  const [amount, setAmount] = useState<number>(3000);
  const [purpose, setPurpose] = useState<'contribution' | 'loan_repayment' | 'welfare'>('contribution');

  // Simulation states: 'form' | 'pushing' | 'stk_prompt' | 'processing' | 'success'
  const [simState, setSimState] = useState<'form' | 'pushing' | 'stk_prompt' | 'processing' | 'success'>('form');
  const [pin, setPin] = useState<string>('');
  const [receiptCode, setReceiptCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const m = members.find((x) => x.id === id);
    if (m) {
      setPhoneNumber(m.phone);
    }
  };

  const handleTriggerPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMessage('Please enter a valid amount greater than KES 0');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage('Please enter a valid Kenyan Safaricom phone number (e.g. 0712345678)');
      return;
    }

    setErrorMessage('');
    setSimState('pushing');

    // Simulate network delay to Daraja Gateway
    setTimeout(() => {
      setSimState('stk_prompt');
    }, 1200);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMessage('Please enter your 4-digit M-Pesa PIN');
      return;
    }

    setErrorMessage('');
    setSimState('processing');

    const generatedRef = generateMpesaReceipt();
    setReceiptCode(generatedRef);

    setTimeout(() => {
      setSimState('success');
      const m = members.find((x) => x.id === selectedMemberId);
      onSuccessfulPayment({
        memberId: selectedMemberId,
        memberName: m ? m.name : 'Chama Member',
        phone: phoneNumber,
        amount: Number(amount),
        type: purpose,
        mpesaRef: generatedRef,
      });
    }, 1800);
  };

  const handleReset = () => {
    setSimState('form');
    setPin('');
    setReceiptCode('');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all">
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">M-Pesa Daraja STK Push Sandbox</h2>
              <p className="text-xs text-emerald-100">Test live contribution flow before getting Paybill</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STATE 1: INITIAL FORM */}
          {simState === 'form' && (
            <form onSubmit={handleTriggerPush} className="space-y-4">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  <strong>No Paybill needed right now!</strong> This sandbox simulates the exact Safaricom STK Push dialogue that your Chama members will see on their phones.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Chama Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone}) - {m.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Category
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'contribution', label: 'Monthly Share' },
                    { id: 'loan_repayment', label: 'Loan Repay' },
                    { id: 'welfare', label: 'Welfare Kitty' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPurpose(p.id as any)}
                      className={`py-2 px-3 rounded-lg border font-medium text-center transition cursor-pointer ${
                        purpose === p.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send STK Push Prompt to Phone</span>
                </button>
              </div>
            </form>
          )}

          {/* STATE 2: PUSHING */}
          {simState === 'pushing' && (
            <div className="py-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800">Dispatching Daraja STK Push...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connecting to Safaricom Gateway for {phoneNumber}
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: SIMULATED PHONE POPUP */}
          {simState === 'stk_prompt' && (
            <div className="py-2">
              {/* Phone Mockup Frame */}
              <div className="mx-auto max-w-[320px] bg-slate-900 rounded-3xl p-4 shadow-xl border-4 border-slate-800 text-center relative overflow-hidden">
                <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
                
                {/* Authentic Safaricom SIM Toolkit dialogue */}
                <div className="bg-slate-100 rounded-xl p-4 text-slate-900 text-left border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      M-PESA SIM ToolKit
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    Do you want to pay <strong className="text-emerald-700">{formatKES(amount)}</strong> to{' '}
                    <strong>AKIBA CHAMA A/C 522522</strong>?
                  </p>

                  <form onSubmit={handleConfirmPin} className="mt-3">
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Enter M-PESA PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      autoFocus
                      className="w-full text-center py-2 px-3 bg-white border border-slate-400 rounded-md text-base tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="py-1.5 text-xs text-slate-600 bg-slate-200 hover:bg-slate-300 rounded font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded font-bold shadow-xs cursor-pointer"
                      >
                        Send PIN
                      </button>
                    </div>
                  </form>
                </div>

                <p className="text-[10px] text-slate-400 mt-3">
                  Tip: Type any 4 digits (e.g. 1234) for testing
                </p>
              </div>
            </div>
          )}

          {/* STATE 4: PROCESSING */}
          {simState === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800">Verifying PIN & Crediting Chama...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Callback received from Safaricom Daraja Webhook
                </p>
              </div>
            </div>
          )}

          {/* STATE 5: SUCCESS & RECEIPT */}
          {simState === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-lg">Transaction Confirmed!</h3>
                <p className="text-xs text-slate-500">Chama balance and member ledger updated immediately</p>
              </div>

              {/* Authentic SMS box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left font-mono text-xs text-slate-800 leading-relaxed shadow-inner">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1 font-sans">
                  <span>MPESA SMS</span>
                  <span>Just now</span>
                </div>
                <p>
                  <strong>{receiptCode}</strong> Confirmed. You have sent <strong>{formatKES(amount)}</strong> to AKIBA CHAMA A/C 522522 on {new Date().toLocaleDateString('en-GB')}. New Chama Balance updated.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Test Another Payment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Done & View Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
