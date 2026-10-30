import React, { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, Users, Wallet } from 'lucide-react';
import { formatKES, Loan, Member, Transaction } from './utils/chamaCalculations';
import { hasPermission } from './utils/rbac';

interface MemberDashboardData {
  member: Member;
  role: Member['role'];
  chama: { id: string; name: string };
  group: {
    members: Array<Pick<Member, 'id' | 'name' | 'role'>>;
    memberCount: number;
    totalSavings: number;
    activeLoanTotal: number;
    currentMonthContributions: number;
  };
  transactions: Transaction[];
  loans: Loan[];
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
  meetings: Array<{ id: string; title: string; startsAt: string; location: string }>;
}

interface MemberDashboardProps {
  onLogout: () => Promise<void>;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ onLogout }) => {
  const [data, setData] = useState<MemberDashboardData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanDuration, setLoanDuration] = useState('3');

  const loadDashboard = async () => {
    setError('');
    try {
      const response = await fetch('/api/member/dashboard', { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load your member dashboard.');
      setData(result as MemberDashboardData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your member dashboard.');
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const logout = async () => {
    setBusy(true);
    setError('');
    try {
      await onLogout();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Could not log out. Please try again.');
      setBusy(false);
    }
  };

  const submitMemberRequest = async (endpoint: string, payload: Record<string, number | string>) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
      setContributionAmount('');
      setLoanAmount('');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <p className={error ? 'text-sm font-semibold text-red-700' : 'text-sm text-slate-600'}>
            {error || 'Loading your member dashboard…'}
          </p>
          {error && (
            <button type="button" onClick={() => void loadDashboard()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/akiba-landing/assets/akiba-logo.png" alt="Akiba" className="h-10 w-10 rounded-xl object-cover" />
          <div>
            <h1 className="font-bold text-slate-900">{data.chama.name}</h1>
            <p className="text-xs text-slate-500">{data.role} · {data.member.status}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}

        <section className="rounded-2xl bg-gradient-to-r from-[#0d754f] to-[#123b55] p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Your chama account</p>
          <h2 className="mt-2 text-3xl font-extrabold">{data.member.name}</h2>
          <p className="mt-1 text-sm text-white/75">{data.role} · {data.member.status}</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Your savings" value={formatKES(data.member.totalSaved)} />
          <SummaryCard label="Your active loan" value={formatKES(data.member.activeLoanAmount)} />
          <SummaryCard label="Group savings total" value={formatKES(data.group.totalSavings)} />
          <SummaryCard label="Group members" value={String(data.group.memberCount)} />
        </section>

        {hasPermission(data.role, 'contributions:create') && hasPermission(data.role, 'loans:create') && (
        <section className="grid gap-6 md:grid-cols-2">
          <form
            className="rounded-2xl border border-slate-200 bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void submitMemberRequest('/api/member/contributions', { amount: Number(contributionAmount), paymentMethod: 'cash' });
            }}
          >
            <h3 className="font-bold text-slate-900">Make a contribution</h3>
            <label className="mt-4 block text-sm font-medium text-slate-600">
              Amount (KES)
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                min="1"
                onChange={(event) => setContributionAmount(event.target.value)}
                required
                type="number"
                value={contributionAmount}
              />
            </label>
            <button disabled={busy} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              Submit contribution
            </button>
            <p className="mt-2 text-xs text-slate-500">The chama admin confirms the contribution.</p>
          </form>

          <form
            className="rounded-2xl border border-slate-200 bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void submitMemberRequest('/api/member/loans', {
                amount: Number(loanAmount),
                durationMonths: Number(loanDuration)
              });
            }}
          >
            <h3 className="font-bold text-slate-900">Apply for a loan</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Amount (KES)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  min="1"
                  onChange={(event) => setLoanAmount(event.target.value)}
                  required
                  type="number"
                  value={loanAmount}
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Duration (months)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  min="1"
                  max="120"
                  onChange={(event) => setLoanDuration(event.target.value)}
                  required
                  type="number"
                  value={loanDuration}
                />
              </label>
            </div>
            <button disabled={busy} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              Submit loan application
            </button>
          </form>
        </section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-1">
            <h3 className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-600" /> My profile</h3>
            <dl className="mt-5 space-y-3 text-sm">
              <ProfileRow label="Email" value={data.member.email} />
              <ProfileRow label="Phone" value={data.member.phone} />
              <ProfileRow label="ID / Passport" value={data.member.idNumber || 'Not provided'} />
              <ProfileRow label="Monthly pledge" value={formatKES(data.member.monthlyPledge)} />
              <ProfileRow label="Joined" value={data.member.joinedDate} />
              <ProfileRow label="Group active loans" value={formatKES(data.group.activeLoanTotal)} />
              <ProfileRow label="Contributions this month" value={formatKES(data.group.currentMonthContributions)} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <h3 className="flex items-center gap-2 font-bold text-slate-900"><Users className="h-5 w-5 text-blue-600" /> Chama members</h3>
            <p className="mt-1 text-xs text-slate-500">Other members’ personal financial and contact details are private.</p>
            <div className="mt-4 divide-y divide-slate-100">
              {data.group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <span className="font-medium text-slate-800">{member.name}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{member.role}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-900"><Wallet className="h-5 w-5 text-emerald-600" /> My transactions</h3>
          {data.transactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No transactions recorded for your account yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Date</th><th>Type</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-3">{transaction.date}</td>
                      <td>{transaction.type.replaceAll('_', ' ')}</td>
                      <td>{transaction.status}</td>
                      <td className="text-right font-semibold">{formatKES(transaction.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold text-slate-900">Announcements</h3>
            {data.announcements.length === 0 ? <p className="mt-3 text-sm text-slate-500">No announcements yet.</p> :
              data.announcements.map((announcement) => (
                <article key={announcement.id} className="mt-4 border-t border-slate-100 pt-3">
                  <h4 className="font-semibold">{announcement.title}</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{announcement.body}</p>
                </article>
              ))}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold text-slate-900">Meeting calendar</h3>
            {data.meetings.length === 0 ? <p className="mt-3 text-sm text-slate-500">No meetings scheduled.</p> :
              data.meetings.map((meeting) => (
                <div key={meeting.id} className="mt-3 border-t border-slate-100 pt-3">
                  <p className="font-semibold">{meeting.title}</p>
                  <p className="text-sm text-slate-500">{meeting.startsAt} {meeting.location && `· ${meeting.location}`}</p>
                </div>
              ))}
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">My loans</h3>
          {data.loans.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No loans recorded for your account yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {data.loans.map((loan) => (
                <div key={loan.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span>{formatKES(loan.amount)} · {loan.status}</span>
                  <span className="text-slate-500">Repaid {formatKES(loan.amountRepaid)} of {formatKES(loan.totalRepayment)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="mt-2 text-xl font-extrabold text-slate-900">{value}</p>
  </div>
);

const ProfileRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-semibold text-slate-800">{value}</dd>
  </div>
);
