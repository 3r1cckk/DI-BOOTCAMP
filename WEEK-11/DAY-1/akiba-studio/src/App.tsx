import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FinancialSummaryCards } from './components/FinancialSummaryCards';
import { QuickActionCards } from './components/QuickActionCards';
import { RecentTransactionsPanel } from './components/RecentTransactionsPanel';
import { MonthlySummaryPanel } from './components/MonthlySummaryPanel';
import { RecordContributionModal } from './components/RecordContributionModal';
import { LoanRequestModal } from './components/LoanRequestModal';
import { LoanApprovalModal } from './components/LoanApprovalModal';
import { AddMemberModal } from './components/AddMemberModal';
import type { MemberInvitationInput, MemberInvitationResult } from './components/AddMemberModal';
import { MpesaSimulatorModal } from './components/MpesaSimulatorModal';
import { ReportsModal } from './components/ReportsModal';
import { VsCodeGuideModal } from './components/VsCodeGuideModal';
import { MembersView } from './components/MembersView';
import { LoansView } from './components/LoansView';
import { LandingPageView } from './components/LandingPageView';
import { AccountAccessPage } from './components/AccountAccessPage';
import type { AuthenticatedUser } from './components/AccountAccessPage';
import { MemberDashboard } from './components/MemberDashboard';
import { canAccessRole } from './components/utils/rbac';
import { 
  Member, 
  Transaction, 
  Loan, 
  calculateTotalSavings, 
  calculateActiveLoanTotal, 
  calculatePendingRepayments, 
  calculateContributionCompliance,
  generateMpesaReceipt
} from './components/utils/chamaCalculations';
import { Terminal, Code2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const hasPasswordResetToken = new URLSearchParams(window.location.hash.slice(1)).has('reset_token');
  const hasInvitationToken = new URLSearchParams(window.location.hash.slice(1)).has('invite_token');
  const hasAccountToken = hasPasswordResetToken || hasInvitationToken;
  const [showLandingPage, setShowLandingPage] = useState<boolean>(!hasAccountToken);
  const [showAccountAccess, setShowAccountAccess] = useState<boolean>(hasAccountToken);
  const [accountServiceError, setAccountServiceError] = useState<string>('');
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [dataSyncError, setDataSyncError] = useState('');

  // Core Chama State
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const activeMembers = members.filter((member) => member.status === 'active');

  // Modals state
  const [isRecordContribOpen, setIsRecordContribOpen] = useState<boolean>(false);
  const [isRequestLoanOpen, setIsRequestLoanOpen] = useState<boolean>(false);
  const [isApproveLoanOpen, setIsApproveLoanOpen] = useState<boolean>(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [isMpesaSimOpen, setIsMpesaSimOpen] = useState<boolean>(false);
  const [isReportsOpen, setIsReportsOpen] = useState<boolean>(false);
  const [isVsCodeGuideOpen, setIsVsCodeGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    if (hasAccountToken) return;
    let active = true;
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not verify your session.');
        return result.user as AuthenticatedUser | null;
      })
      .then((user) => {
        if (!active || !user) return;
        setAuthenticatedUser(user);
        setShowLandingPage(false);
        setShowAccountAccess(false);
      })
      .catch((error: unknown) => {
        if (active) setAccountServiceError(error instanceof Error ? error.message : 'Could not verify your session.');
      });
    return () => {
      active = false;
    };
  }, []);

  // Financial Metrics
  const totalSavings = calculateTotalSavings(members);
  const activeLoanTotal = calculateActiveLoanTotal(loans);
  const pendingRepayments = calculatePendingRepayments(loans);
  const monthlyTarget = activeMembers.reduce((sum, m) => sum + (m.monthlyPledge || 0), 0);
  
  // Calculate this month's collected
  const monthlyContributions = transactions
    .filter(
      (tx) =>
        tx.type === 'contribution' &&
        activeMembers.some((member) => member.id === tx.memberId)
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const complianceRate = calculateContributionCompliance(activeMembers, monthlyContributions);
  const pendingLoans = loans.filter((l) => l.status === 'pending');
  const activeLoansCount = loans.filter((loan) => loan.status === 'active').length;
  const paidMembersCount = new Set(
    transactions
      .filter((transaction) =>
        transaction.type === 'contribution' &&
        transaction.date.slice(0, 7) === new Date().toISOString().slice(0, 7)
      )
      .map((transaction) => transaction.memberId)
  ).size;

  useEffect(() => {
    if (!authenticatedUser || authenticatedUser.role !== 'admin') return;
    let active = true;
    setAdminDataLoaded(false);
    setDataSyncError('');
    fetch('/api/admin/chama-data', { credentials: 'same-origin' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load chama data.');
        return result as { members: Member[]; transactions: Transaction[]; loans: Loan[] };
      })
      .then((data) => {
        if (!active) return;
        setMembers(data.members);
        setTransactions(data.transactions);
        setLoans(data.loans);
        setAdminDataLoaded(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDataSyncError(error instanceof Error ? error.message : 'Could not load chama data.');
        setShowAccountAccess(true);
        setAuthenticatedUser(null);
      });
    return () => {
      active = false;
    };
  }, [authenticatedUser]);

  useEffect(() => {
    if (!authenticatedUser || authenticatedUser.role !== 'admin' || !adminDataLoaded) return;
    let active = true;
    const timer = window.setTimeout(() => {
      fetch('/api/admin/chama-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ members, transactions, loans }),
      })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Could not save chama data.');
          if (active) setDataSyncError('');
        })
        .catch((error: unknown) => {
          if (active) setDataSyncError(error instanceof Error ? error.message : 'Could not save chama data.');
        });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [authenticatedUser, adminDataLoaded, members, transactions, loans]);

  // HANDLERS
  const handleAddContribution = (data: {
    memberId: string;
    memberName: string;
    phone: string;
    type: 'contribution' | 'welfare';
    amount: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'cash';
    mpesaRef: string;
    notes: string;
  }) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      memberId: data.memberId,
      memberName: data.memberName,
      phone: data.phone,
      type: data.type,
      amount: data.amount,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
      paymentMethod: data.paymentMethod,
      mpesaRef: data.mpesaRef,
      notes: data.notes,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update member's total savings
    setMembers((prev) =>
      prev.map((m) =>
        m.id === data.memberId
          ? { ...m, totalSaved: m.totalSaved + data.amount }
          : m
      )
    );
  };

  const handleMpesaPayment = (data: {
    memberId: string;
    memberName: string;
    phone: string;
    amount: number;
    type: 'contribution' | 'loan_repayment' | 'welfare';
    mpesaRef: string;
  }) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      memberId: data.memberId,
      memberName: data.memberName,
      phone: data.phone,
      type: data.type,
      amount: data.amount,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
      paymentMethod: 'mpesa',
      mpesaRef: data.mpesaRef,
      notes: 'Automated M-Pesa STK Push Confirmation',
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (data.type === 'contribution' || data.type === 'welfare') {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === data.memberId
            ? { ...m, totalSaved: m.totalSaved + data.amount }
            : m
        )
      );
    } else if (data.type === 'loan_repayment') {
      setLoans((prev) =>
        prev.map((l) =>
          l.memberId === data.memberId && l.status === 'active'
            ? { ...l, amountRepaid: l.amountRepaid + data.amount }
            : l
        )
      );
    }
  };

  const handleRequestLoan = (data: {
    memberId: string;
    memberName: string;
    amount: number;
    interestRate: number;
    durationMonths: number;
    guarantorName: string;
  }) => {
    const interest = Math.round(data.amount * (data.interestRate / 100));
    const totalRepayment = data.amount + interest;
    const monthlyInstallment = Math.round(totalRepayment / data.durationMonths);

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      memberId: data.memberId,
      memberName: data.memberName,
      amount: data.amount,
      interestRate: data.interestRate,
      durationMonths: data.durationMonths,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + data.durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      monthlyInstallment,
      totalRepayment,
      amountRepaid: 0,
      guarantorName: data.guarantorName,
      status: 'pending',
    };

    setLoans((prev) => [newLoan, ...prev]);
  };

  const handleApproveLoan = (loanId: string) => {
    const loanToApprove = loans.find((l) => l.id === loanId);
    if (!loanToApprove) return;

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'active' } : l))
    );

    // Record loan disbursement transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      memberId: loanToApprove.memberId,
      memberName: loanToApprove.memberName,
      phone: members.find((m) => m.id === loanToApprove.memberId)?.phone || '07XXXXXXXX',
      type: 'loan_disbursement',
      amount: loanToApprove.amount,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
      paymentMethod: 'mpesa',
      mpesaRef: generateMpesaReceipt(),
      notes: `Loan Disbursed: ${loanToApprove.durationMonths} months @ ${loanToApprove.interestRate}%`,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleRejectLoan = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'rejected' } : l))
    );
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) throw new Error('The server could not end your session.');
      setAuthenticatedUser(null);
      setAdminDataLoaded(false);
      setShowAccountAccess(true);
      setShowLandingPage(false);
    } catch (error) {
      setDataSyncError(error instanceof Error ? error.message : 'Could not log out. Please try again.');
    }
  };

  const handleAddMember = async (
    newMem: MemberInvitationInput
  ): Promise<MemberInvitationResult> => {
    const response = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(newMem),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not create the member invitation.');
    if (typeof result.invitationUrl !== 'string' ||
      !['email', 'sms'].includes(result.delivery) ||
      typeof result.expiresAt !== 'number') {
      throw new Error('The invitation service returned an invalid response.');
    }
    return result as MemberInvitationResult;
  };

  const handleUpdateMember = async (
    member: Member,
    changes: { role?: Member['role']; status?: Member['status'] }
  ) => {
    try {
      const response = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(changes),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update this chama membership.');
      setMembers((previous) => previous.map((current) =>
        current.id === member.id ? { ...current, ...changes } : current
      ));
      setDataSyncError('');
    } catch (error) {
      setDataSyncError(error instanceof Error ? error.message : 'Could not update this chama membership.');
    }
  };

  const handleRemoveMember = (member: Member) => {
    const hasUnresolvedLoan = loans.some(
      (loan) =>
        loan.memberId === member.id &&
        ['pending', 'approved', 'active'].includes(loan.status)
    );

    if (hasUnresolvedLoan) {
      window.alert('This member has a pending or outstanding loan. Resolve it before removing the member.');
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.name} from active membership? Their contribution and transaction history will be retained.`
    );
    if (!confirmed) return;

    setMembers((prev) =>
      prev.map((current) =>
        current.id === member.id ? { ...current, status: 'inactive' } : current
      )
    );
  };

  // Render Landing Page if selected
  if (showLandingPage) {
    return (
      <LandingPageView
        onDashboardRequest={() => {
          setShowAccountAccess(true);
          setShowLandingPage(false);
        }}
      />
    );
  }

  if (showAccountAccess) {
    return (
      <AccountAccessPage
        initialError={accountServiceError || dataSyncError}
        onAuthenticated={(user) => {
          setAuthenticatedUser(user);
          setShowAccountAccess(false);
          setShowLandingPage(false);
        }}
        onBackToLanding={() => {
          setShowAccountAccess(false);
          setShowLandingPage(true);
        }}
      />
    );
  }

  if (authenticatedUser && !canAccessRole(authenticatedUser.role, ['admin'])) {
    return (
      <MemberDashboard
        onLogout={async () => {
          const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
          if (!response.ok) throw new Error('The server could not end your session.');
          setAuthenticatedUser(null);
          setShowAccountAccess(true);
        }}
      />
    );
  }

  if (!authenticatedUser || !adminDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="font-semibold text-slate-800">{dataSyncError || 'Loading your secure dashboard…'}</p>
          {dataSyncError && (
            <button
              type="button"
              onClick={() => {
                setDataSyncError('');
                setShowAccountAccess(true);
              }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              Return to login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Deep-Blue Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenVsCodeGuide={() => setIsVsCodeGuideOpen(true)}
        onToggleLandingPage={() => setShowLandingPage(true)}
        onLogout={() => void handleLogout()}
        memberCount={activeMembers.length}
        pendingLoanCount={pendingLoans.length}
      />

      {/* 2. Main Content Area (White / Clean Canvas) */}
      <div className="flex-1 flex flex-col min-w-0">
        {dataSyncError && (
          <div className="bg-red-50 px-6 py-2 text-sm text-red-800" role="alert">
            Chama data synchronization failed: {dataSyncError}
          </div>
        )}
        {/* Top Search & Profile Bar */}
        <TopBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenVsCodeGuide={() => setIsVsCodeGuideOpen(true)}
          pendingLoanCount={pendingLoans.length}
        />

        {/* View Switcher based on currentTab */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <>
              {/* Four Financial Summary Cards */}
              <FinancialSummaryCards
                totalSavings={totalSavings}
                activeLoanTotal={activeLoanTotal}
                pendingRepayments={pendingRepayments}
                monthlyContributions={monthlyContributions}
                monthlyTarget={monthlyTarget}
                complianceRate={complianceRate}
                activeMemberCount={activeMembers.length}
                activeLoanCount={activeLoansCount}
                pendingLoanCount={pendingLoans.length}
              />

              {/* Six Quick-Action Cards */}
              <QuickActionCards
                onOpenRecordContribution={() => setIsRecordContribOpen(true)}
                onOpenRequestLoan={() => setIsRequestLoanOpen(true)}
                onOpenApproveLoans={() => setIsApproveLoanOpen(true)}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenMpesaSimulator={() => setIsMpesaSimOpen(true)}
                onOpenExportReports={() => setIsReportsOpen(true)}
                pendingLoanCount={pendingLoans.length}
              />

              {/* Recent Transactions & Monthly Summary Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                  <RecentTransactionsPanel
                    transactions={transactions}
                    searchQuery={searchQuery}
                  />
                </div>
                <div className="lg:col-span-1">
                  <MonthlySummaryPanel
                    monthlyTarget={monthlyTarget}
                    monthlyCollected={monthlyContributions}
                    activeMembersCount={activeMembers.length}
                    paidMembersCount={paidMembersCount}
                    onOpenRecordContribution={() => setIsRecordContribOpen(true)}
                  />
                </div>
              </div>
            </>
          )}

          {currentTab === 'members' && (
            <MembersView
              members={members}
              onOpenAddMember={() => setIsAddMemberOpen(true)}
              onRemoveMember={handleRemoveMember}
              onUpdateMember={(member, changes) => void handleUpdateMember(member, changes)}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'loans' && (
            <LoansView
              loans={loans}
              onOpenRequestLoan={() => setIsRequestLoanOpen(true)}
              onOpenApproveLoans={() => setIsApproveLoanOpen(true)}
              pendingLoanCount={pendingLoans.length}
            />
          )}

          {currentTab === 'contributions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Contribution Ledger</h2>
                <button
                  onClick={() => setIsRecordContribOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Record Contribution
                </button>
              </div>
              <RecentTransactionsPanel
                transactions={transactions.filter((t) => t.type === 'contribution' || t.type === 'welfare')}
                searchQuery={searchQuery}
              />
            </div>
          )}

          {currentTab === 'mpesa' && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Terminal className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Safaricom Daraja STK Push Sandbox</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Test how M-Pesa automatic contributions work without needing an active Till or Paybill number right away.
              </p>
              <button
                onClick={() => setIsMpesaSimOpen(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
              >
                Launch Live STK Push Test
              </button>
            </div>
          )}

          {currentTab === 'reports' && (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center max-w-xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Chama Financial Reports & Balance Sheet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Generate official monthly contribution summaries, loan portfolios, and CSV files for member meetings.
              </p>
              <button
                onClick={() => setIsReportsOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
              >
                Open Statement Generator
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <RecordContributionModal
        isOpen={isRecordContribOpen}
        onClose={() => setIsRecordContribOpen(false)}
        members={activeMembers}
        onAddContribution={handleAddContribution}
      />

      <LoanRequestModal
        isOpen={isRequestLoanOpen}
        onClose={() => setIsRequestLoanOpen(false)}
        members={activeMembers}
        onRequestLoan={handleRequestLoan}
      />

      <LoanApprovalModal
        isOpen={isApproveLoanOpen}
        onClose={() => setIsApproveLoanOpen(false)}
        pendingLoans={pendingLoans}
        onApproveLoan={handleApproveLoan}
        onRejectLoan={handleRejectLoan}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
      />

      <MpesaSimulatorModal
        isOpen={isMpesaSimOpen}
        onClose={() => setIsMpesaSimOpen(false)}
        members={activeMembers}
        onSuccessfulPayment={handleMpesaPayment}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        members={members}
        loans={loans}
        transactions={transactions}
        totalSavings={totalSavings}
        activeLoanTotal={activeLoanTotal}
      />

      <VsCodeGuideModal
        isOpen={isVsCodeGuideOpen}
        onClose={() => setIsVsCodeGuideOpen(false)}
      />
    </div>
  );
}
