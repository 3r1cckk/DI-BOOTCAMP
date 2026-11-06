import React, { useState } from 'react';
import { Check, Copy, UserPlus, X } from 'lucide-react';
import { Member } from './utils/chamaCalculations';

export interface MemberInvitationInput {
  name: string;
  phoneOrEmail: string;
  idNumber: string;
  role: Member['role'];
  monthlyPledge: number;
}

export interface MemberInvitationResult {
  invitationUrl: string;
  delivery: 'email' | 'sms';
  expiresAt: number;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: MemberInvitationInput) => Promise<MemberInvitationResult>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [role, setRole] = useState<Member['role']>('member');
  const [monthlyPledge, setMonthlyPledge] = useState(5000);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<MemberInvitationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (isOpen) return;
    setName('');
    setPhoneOrEmail('');
    setIdNumber('');
    setRole('member');
    setMonthlyPledge(5000);
    setError('');
    setInvitation(null);
    setCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await onAddMember({
        name: name.trim(),
        phoneOrEmail: phoneOrEmail.trim(),
        idNumber: idNumber.trim(),
        role,
        monthlyPledge: Number(monthlyPledge),
      });
      setInvitation(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create the invitation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Invite a Chama Member</h2>
              <p className="text-xs text-slate-500">They will create their own password using a secure link.</p>
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
              Full Legal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Enter member name"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone number or email
              </label>
              <input
                type="text"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                maxLength={254}
                placeholder="07XXXXXXXX or member@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                National ID / Passport
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                maxLength={80}
                placeholder="e.g. 29482710"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chama Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Member['role'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600"
              >
                <option value="member">Member</option>
                <option value="treasurer">Treasurer</option>
                <option value="secretary">Secretary</option>
                <option value="chairperson">Chairperson</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Monthly Pledge (KES)
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={monthlyPledge}
                onChange={(e) => setMonthlyPledge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>
          </div>

          {invitation && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-800" role="status">
                {invitation.delivery === 'email'
                  ? 'Invitation email sent. You can also copy the link to share it.'
                  : 'Invitation SMS sent. You can also copy the link to share it by WhatsApp.'}
                {' '}Expires {new Date(invitation.expiresAt).toLocaleString()}.
              </p>
              <div className="flex gap-2">
                <input
                  aria-label="Invitation link"
                  className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-2 py-2 text-xs"
                  readOnly
                  value={invitation.invitationUrl}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invitation.invitationUrl);
                      setCopied(true);
                    } catch {
                      setError('Could not copy the link. Select and copy it manually.');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {invitation ? 'Done' : 'Cancel'}
            </button>
            {!invitation && (
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Creating invitation…' : 'Create invitation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
