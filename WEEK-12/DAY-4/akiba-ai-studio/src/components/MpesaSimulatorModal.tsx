import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Info,
  Smartphone,
  X,
} from 'lucide-react';
import { Member, formatKES } from '../utils/chamaCalculations';

interface MpesaSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onVerifiedPayment: (data: {
    memberId: string;
    memberName: string;
    phone: string;
    amount: number;
    type: 'contribution' | 'loan_repayment' | 'welfare';
    mpesaRef: string;
  }) => Promise<boolean>;
}

type PaymentPurpose = 'contribution' | 'loan_repayment' | 'welfare';
type ModalStep = 'details' | 'instructions' | 'success';

const businessPhone = import.meta.env.VITE_POCHI_BUSINESS_PHONE?.trim() ?? '';

export const MpesaSimulatorModal: React.FC<MpesaSimulatorModalProps> = ({
  isOpen,
  onClose,
  members,
  onVerifiedPayment,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(members[0]?.phone || '');
  const [amount, setAmount] = useState<number>(3000);
  const [purpose, setPurpose] = useState<PaymentPurpose>('contribution');
  const [step, setStep] = useState<ModalStep>('details');
  const [receiptCode, setReceiptCode] = useState('');
  const [verifiedInPochi, setVerifiedInPochi] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const member = members.find((item) => item.id === id);
    if (member) setPhoneNumber(member.phone);
  };

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    const validKenyanPhone = /^(?:\+?254|0)?[17]\d{8}$/.test(phoneNumber.replace(/[\s-]/g, ''));

    if (!businessPhone) {
      setErrorMessage('Pochi business number is not configured. Set VITE_POCHI_BUSINESS_PHONE in .env.local and restart the app.');
      return;
    }
    if (!validKenyanPhone) {
      setErrorMessage('Enter a valid Kenyan mobile number, such as 0712345678.');
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setErrorMessage('Enter a valid amount greater than KES 0.');
      return;
    }
    if (!selectedMemberId) {
      setErrorMessage('Select a chama member before continuing.');
      return;
    }

    setErrorMessage('');
    setStep('instructions');
  };

  const handleCopyBusinessPhone = async () => {
    try {
      await navigator.clipboard.writeText(businessPhone);
      setCopyMessage('Copied');
    } catch (error) {
      console.error('Unable to copy the Pochi business number.', error);
      setCopyMessage('Copy unavailable — select the number to copy it.');
    }
  };

  const handleRecordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const reference = receiptCode.trim().toUpperCase();
    if (!reference) {
      setErrorMessage('Enter the M-PESA receipt code from the payment confirmation.');
      return;
    }
    if (!verifiedInPochi) {
      setErrorMessage('Verify the payment in the recipient Pochi account before recording it.');
      return;
    }

    const member = members.find((item) => item.id === selectedMemberId);
    setIsRecording(true);
    try {
      const recorded = await onVerifiedPayment({
        memberId: selectedMemberId,
        memberName: member?.name ?? 'Chama Member',
        phone: phoneNumber,
        amount,
        type: purpose,
        mpesaRef: reference,
      });

      if (!recorded) {
        setErrorMessage('That M-PESA receipt code is already in the ledger. Check the recipient account and try again.');
        return;
      }

      setErrorMessage('');
      setStep('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to record M-PESA payment.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    setStep('details');
    setReceiptCode('');
    setVerifiedInPochi(false);
    setErrorMessage('');
    setCopyMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Pochi la Biashara Payment</h2>
              <p className="text-xs text-emerald-100">Manual M-PESA payment and verification</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-emerald-100 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleContinue} className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p>
                  This does not send an STK prompt. The payer completes the payment in M-PESA;
                  record it only after confirming it in the recipient Pochi account.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Chama member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(event) => handleMemberChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.phone}) - {member.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Payer M-PESA number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="0712345678"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Purpose
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {([
                    { id: 'contribution', label: 'Monthly Share' },
                    { id: 'loan_repayment', label: 'Loan Repay' },
                    { id: 'welfare', label: 'Welfare Kitty' },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPurpose(item.id)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-center font-medium transition ${
                        purpose === item.id
                          ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
              >
                Show Pochi payment instructions
              </button>
            </form>
          )}

          {step === 'instructions' && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Pay the business via Pochi la Biashara
                </p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-emerald-950">
                  <li>Open M-PESA and choose Pochi la Biashara.</li>
                  <li>Choose the option to pay/send to a Pochi business.</li>
                  <li>Enter the business number below and {formatKES(amount)}.</li>
                  <li>Confirm the recipient and complete payment in M-PESA.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Pochi business number</p>
                  <p className="mt-1 font-mono text-xl font-bold text-slate-900">
                    {businessPhone || 'Not configured'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBusinessPhone}
                  disabled={!businessPhone}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              {copyMessage && <p className="text-right text-xs text-slate-500">{copyMessage}</p>}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  M-PESA receipt code
                </label>
                <input
                  type="text"
                  value={receiptCode}
                  onChange={(event) => setReceiptCode(event.target.value)}
                  placeholder="Enter code from the M-PESA confirmation"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={verifiedInPochi}
                  onChange={(event) => setVerifiedInPochi(event.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>
                  I verified the amount, payer and receipt in the recipient Pochi transaction history.
                  I understand this app cannot verify M-PESA payments automatically.
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setErrorMessage('');
                  }}
                  disabled={isRecording}
                  className="w-1/3 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isRecording}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isRecording ? 'Saving…' : 'Record verified payment'}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Payment recorded</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Receipt {receiptCode.trim().toUpperCase()} was entered after manual verification in Pochi.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isRecording}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
