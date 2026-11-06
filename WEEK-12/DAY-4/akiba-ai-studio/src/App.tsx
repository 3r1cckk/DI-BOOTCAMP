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
import { MpesaSimulatorModal } from './components/MpesaSimulatorModal';
import { ReportsModal } from './components/ReportsModal';
import { VsCodeGuideModal } from './components/VsCodeGuideModal';
import { MembersView } from './components/MembersView';
import { LoansView } from './components/LoansView';
import { LandingPageView } from './components/LandingPageView';
import { AccountPage, type AccountMode } from './components/AccountPage';
import { 
  Member, 
  Transaction, 
  Loan, 
  calculateTotalSavings, 
  calculateActiveLoanTotal, 
  calculatePendingRepayments, 
  calculateContributionCompliance,
  generateMpesaReceipt
} from './utils/chamaCalculations';
import { Terminal } from 'lucide-react';
import {
  approveLoan as persistLoanApproval,
  getCurrentUser,
  initializeChamaData,
  loadChamaData,
  recordContribution,
  recordMpesaPayment,
  rejectLoan as persistLoanRejection,
  saveLoan,
  saveMember,
  signIn,
  signOut,
  signUp,
  type AuthUser,
} from './lib/database';

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Faith Wanjiku',
    phone: '0712345678',
    email: 'faith.wanjiku@gmail.com',
    idNumber: '28475910',
    role: 'Chairperson',
    joinedDate: '2023-01-10',
    totalSaved: 165000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm2',
    name: 'Erick Omondi',
    phone: '0722334455',
    email: 'erick.omondi@gmail.com',
    idNumber: '29837482',
    role: 'Treasurer',
    joinedDate: '2023-01-10',
    totalSaved: 180000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm3',
    name: 'Mary Muthoni',
    phone: '0733445566',
    email: 'mary.muthoni@gmail.com',
    idNumber: '31849203',
    role: 'Secretary',
    joinedDate: '2023-02-01',
    totalSaved: 140000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm4',
    name: 'Brian Kiprop',
    phone: '0744556677',
    email: 'brian.kiprop@gmail.com',
    idNumber: '32094857',
    role: 'Member',
    joinedDate: '2023-03-15',
    totalSaved: 125000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 50000,
  },
  {
    id: 'm5',
    name: 'Kevin Omondi',
    phone: '0755667788',
    email: 'kevin.omondi@gmail.com',
    idNumber: '30495821',
    role: 'Member',
    joinedDate: '2023-04-01',
    totalSaved: 110000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm6',
    name: 'Grace Achieng',
    phone: '0766778899',
    email: 'grace.achieng@gmail.com',
    idNumber: '29817264',
    role: 'Member',
    joinedDate: '2023-04-15',
    totalSaved: 130000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm7',
    name: 'Peter Kamau',
    phone: '0777889900',
    email: 'peter.kamau@gmail.com',
    idNumber: '33491827',
    role: 'Member',
    joinedDate: '2023-05-01',
    totalSaved: 95000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 30000,
  },
  {
    id: 'm8',
    name: 'Sharon Chebet',
    phone: '0788990011',
    email: 'sharon.chebet@gmail.com',
    idNumber: '34918273',
    role: 'Member',
    joinedDate: '2023-06-12',
    totalSaved: 85000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm9',
    name: 'Dennis Mwangi',
    phone: '0799001122',
    email: 'dennis.mwangi@gmail.com',
    idNumber: '31928374',
    role: 'Member',
    joinedDate: '2023-07-01',
    totalSaved: 90000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm10',
    name: 'John Mutua',
    phone: '0711223344',
    email: 'john.mutua@gmail.com',
    idNumber: '28192847',
    role: 'Member',
    joinedDate: '2023-08-10',
    totalSaved: 105000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm11',
    name: 'Lucy Njeri',
    phone: '0722114433',
    email: 'lucy.njeri@gmail.com',
    idNumber: '30294817',
    role: 'Member',
    joinedDate: '2023-09-01',
    totalSaved: 75000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm12',
    name: 'Samuel Kiprotich',
    phone: '0733225544',
    email: 'samuel.k@gmail.com',
    idNumber: '32918274',
    role: 'Member',
    joinedDate: '2023-09-15',
    totalSaved: 70000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm13',
    name: 'Beatrice Atieno',
    phone: '0744336655',
    email: 'beatrice.a@gmail.com',
    idNumber: '34192837',
    role: 'Member',
    joinedDate: '2023-10-01',
    totalSaved: 65000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
  {
    id: 'm14',
    name: 'George Njoroge',
    phone: '0755447766',
    email: 'george.n@gmail.com',
    idNumber: '31029384',
    role: 'Member',
    joinedDate: '2023-10-10',
    totalSaved: 60000,
    monthlyPledge: 10000,
    status: 'active',
    activeLoanAmount: 0,
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    memberId: 'm1',
    memberName: 'Faith Wanjiku',
    phone: '0712345678',
    type: 'contribution',
    amount: 10000,
    date: '2026-10-22 14:32',
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaRef: 'QHK9824XJ7',
    notes: 'October monthly savings',
  },
  {
    id: 'tx-102',
    memberId: 'm5',
    memberName: 'Kevin Omondi',
    phone: '0755667788',
    type: 'contribution',
    amount: 10000,
    date: '2026-10-22 11:15',
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaRef: 'QHL4829BN3',
    notes: 'October shares via M-Pesa STK',
  },
  {
    id: 'tx-103',
    memberId: 'm4',
    memberName: 'Brian Kiprop',
    phone: '0744556677',
    type: 'loan_repayment',
    amount: 11000,
    date: '2026-10-21 16:45',
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaRef: 'QHM3910KLP',
    notes: 'Monthly loan installment 2 of 5',
  },
  {
    id: 'tx-104',
    memberId: 'm6',
    memberName: 'Grace Achieng',
    phone: '0766778899',
    type: 'contribution',
    amount: 10000,
    date: '2026-10-20 09:20',
    status: 'completed',
    paymentMethod: 'bank_transfer',
    mpesaRef: 'BK-948201',
    notes: 'Co-op Bank direct deposit',
  },
  {
    id: 'tx-105',
    memberId: 'm7',
    memberName: 'Peter Kamau',
    phone: '0777889900',
    type: 'welfare',
    amount: 2000,
    date: '2026-10-19 17:05',
    status: 'completed',
    paymentMethod: 'cash',
    mpesaRef: 'CSH-4821',
    notes: 'Emergency welfare kitty contribution',
  },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan-1',
    memberId: 'm4',
    memberName: 'Brian Kiprop',
    amount: 50000,
    interestRate: 10,
    durationMonths: 5,
    startDate: '2026-08-01',
    dueDate: '2027-01-01',
    monthlyInstallment: 11000,
    totalRepayment: 55000,
    amountRepaid: 22000,
    guarantorName: 'Faith Wanjiku',
    status: 'active',
  },
  {
    id: 'loan-2',
    memberId: 'm7',
    memberName: 'Peter Kamau',
    amount: 30000,
    interestRate: 10,
    durationMonths: 3,
    startDate: '2026-09-01',
    dueDate: '2026-12-01',
    monthlyInstallment: 11000,
    totalRepayment: 33000,
    amountRepaid: 11000,
    guarantorName: 'Brian Kiprop',
    status: 'active',
  },
  {
    id: 'loan-3',
    memberId: 'm8',
    memberName: 'Sharon Chebet',
    amount: 40000,
    interestRate: 10,
    durationMonths: 4,
    startDate: '2026-10-20',
    dueDate: '2027-02-20',
    monthlyInstallment: 11000,
    totalRepayment: 44000,
    amountRepaid: 0,
    guarantorName: 'Kevin Omondi',
    status: 'pending',
  },
  {
    id: 'loan-4',
    memberId: 'm9',
    memberName: 'Dennis Mwangi',
    amount: 25000,
    interestRate: 10,
    durationMonths: 3,
    startDate: '2026-10-21',
    dueDate: '2027-01-21',
    monthlyInstallment: 9167,
    totalRepayment: 27500,
    amountRepaid: 0,
    guarantorName: 'Faith Wanjiku',
    status: 'pending',
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [accountMode, setAccountMode] = useState<AccountMode | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(true);
  const [databaseLoadSucceeded, setDatabaseLoadSucceeded] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  // Core Chama State
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);

  useEffect(() => {
    let isMounted = true;

    void getCurrentUser()
      .then(({ user }) => {
        if (!isMounted) return;
        setAuthUser(user);
        if (user) {
          setDataReady(false);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setDatabaseError(error instanceof Error ? error.message : 'Unable to check your sign-in status.');
        }
      })
      .finally(() => {
        if (isMounted) setAuthReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!authUser) {
      setDataReady(true);
      setDatabaseLoadSucceeded(false);
      return;
    }

    let isMounted = true;
    setDataReady(false);
    setDatabaseLoadSucceeded(false);
    setDatabaseError(null);

    void (async () => {
      try {
        let data = await loadChamaData();
        if (data.members.length === 0 && data.loans.length === 0 && data.transactions.length === 0) {
          await initializeChamaData({
            members: INITIAL_MEMBERS,
            loans: INITIAL_LOANS,
            transactions: INITIAL_TRANSACTIONS,
          });
          data = await loadChamaData();
        }
        if (!isMounted) return;
        setMembers(data.members);
        setLoans(data.loans);
        setTransactions(data.transactions);
        setDatabaseLoadSucceeded(true);
      } catch (error) {
        if (isMounted) {
          setDatabaseError(error instanceof Error ? error.message : 'Unable to load or initialize the SQLite database.');
        }
      } finally {
        if (isMounted) setDataReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authReady, authUser, reloadVersion]);

  // Modals state
  const [isRecordContribOpen, setIsRecordContribOpen] = useState<boolean>(false);
  const [isRequestLoanOpen, setIsRequestLoanOpen] = useState<boolean>(false);
  const [isApproveLoanOpen, setIsApproveLoanOpen] = useState<boolean>(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [isMpesaSimOpen, setIsMpesaSimOpen] = useState<boolean>(false);
  const [isReportsOpen, setIsReportsOpen] = useState<boolean>(false);
  const [isVsCodeGuideOpen, setIsVsCodeGuideOpen] = useState<boolean>(false);

  // Financial Metrics
  const totalSavings = calculateTotalSavings(members);
  const activeLoanTotal = calculateActiveLoanTotal(loans);
  const pendingRepayments = calculatePendingRepayments(loans);
  const monthlyTarget = members.reduce((sum, m) => sum + (m.monthlyPledge || 0), 0);
  
  // Calculate this month's collected
  const monthlyContributions = transactions
    .filter((tx) => tx.type === 'contribution' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const complianceRate = calculateContributionCompliance(members, monthlyContributions);
  const pendingLoans = loans.filter((l) => l.status === 'pending');

  // HANDLERS
  const handleAddContribution = async (data: {
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
      id: crypto.randomUUID(),
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

    try {
      await recordContribution(newTx);
      setDatabaseError(null);
      setTransactions((prev) => [newTx, ...prev]);

      setMembers((prev) =>
        prev.map((m) =>
          m.id === data.memberId
            ? { ...m, totalSaved: m.totalSaved + data.amount }
            : m
        )
      );
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to save contribution.');
      throw error;
    }
  };

  const handleMpesaPayment = async (data: {
    memberId: string;
    memberName: string;
    phone: string;
    amount: number;
    type: 'contribution' | 'loan_repayment' | 'welfare';
    mpesaRef: string;
  }): Promise<boolean> => {
    const mpesaRef = data.mpesaRef.trim().toUpperCase();
    if (transactions.some((tx) => tx.mpesaRef?.toUpperCase() === mpesaRef)) {
      return false;
    }

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      memberId: data.memberId,
      memberName: data.memberName,
      phone: data.phone,
      type: data.type,
      amount: data.amount,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
      paymentMethod: 'mpesa',
      mpesaRef,
      notes: 'Pochi la Biashara payment verified manually in recipient account',
    };

    try {
      await recordMpesaPayment(newTx);
      setDatabaseError(null);
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
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to save M-PESA payment.');
      throw error;
    }

    return true;
  };

  const handleRequestLoan = async (data: {
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
      id: crypto.randomUUID(),
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

    try {
      await saveLoan(newLoan);
      setDatabaseError(null);
      setLoans((prev) => [newLoan, ...prev]);
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to save loan request.');
      throw error;
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    const loanToApprove = loans.find((l) => l.id === loanId);
    if (!loanToApprove) return;

    // Record loan disbursement transaction
    const newTx: Transaction = {
      id: crypto.randomUUID(),
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

    try {
      await persistLoanApproval(loanId, newTx);
      setDatabaseError(null);
      setLoans((prev) =>
        prev.map((l) => (l.id === loanId ? { ...l, status: 'active' } : l))
      );
      setTransactions((prev) => [newTx, ...prev]);
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to approve loan.');
      throw error;
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    try {
      await persistLoanRejection(loanId);
      setDatabaseError(null);
      setLoans((prev) =>
        prev.map((l) => (l.id === loanId ? { ...l, status: 'rejected' } : l))
      );
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to reject loan.');
      throw error;
    }
  };

  const handleAddMember = async (newMem: Omit<Member, 'id' | 'totalSaved' | 'activeLoanAmount' | 'status' | 'joinedDate'>) => {
    const member: Member = {
      ...newMem,
      id: crypto.randomUUID(),
      joinedDate: new Date().toISOString().slice(0, 10),
      totalSaved: 0,
      activeLoanAmount: 0,
      status: 'active',
    };
    try {
      await saveMember(member);
      setDatabaseError(null);
      setMembers((prev) => [...prev, member]);
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to save member.');
      throw error;
    }
  };

  const handleAccountSubmit = async (email: string, password: string) => {
    const result = accountMode === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password);
    setDataReady(false);
    setDatabaseLoadSucceeded(false);
    setAuthUser(result.user);
    setAccountMode(null);
    setShowLandingPage(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthUser(null);
      setDataReady(true);
      setDatabaseLoadSucceeded(false);
      setShowLandingPage(true);
      setCurrentTab('dashboard');
      setDatabaseError(null);
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  const handleOpenAccountPage = (mode: AccountMode) => {
    if (authUser) {
      setShowLandingPage(false);
      return;
    }
    setAccountMode(mode);
  };

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Checking your account…</div>;
  }

  if (!authUser) {
    if (accountMode) {
      return (
        <AccountPage
          mode={accountMode}
          onBack={() => setAccountMode(null)}
          onModeChange={setAccountMode}
          onSubmit={handleAccountSubmit}
        />
      );
    }
    return (
      <LandingPageView
        onGoToDashboard={() => handleOpenAccountPage('login')}
        onLogin={() => handleOpenAccountPage('login')}
        onSignUp={() => handleOpenAccountPage('signup')}
      />
    );
  }

  if (showLandingPage) {
    return (
      <LandingPageView
        onGoToDashboard={() => setShowLandingPage(false)}
        onLogin={() => handleOpenAccountPage('login')}
        onSignUp={() => handleOpenAccountPage('signup')}
      />
    );
  }

  if (!dataReady) {
    return <div className="p-8 text-center text-slate-600">Loading chama data…</div>;
  }

  if (!databaseLoadSucceeded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div role="alert" className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h1 className="font-bold text-slate-900">Unable to load chama data</h1>
          <p className="mt-2 text-sm text-rose-700">{databaseError}</p>
          <p className="mt-2 text-sm text-slate-600">Check that the `database` folder is writable and Node.js 22.13 or newer is installed.</p>
          <button
            onClick={() => setReloadVersion((version) => version + 1)}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </main>
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
      />

      {/* 2. Main Content Area (White / Clean Canvas) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Search & Profile Bar */}
        <TopBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenVsCodeGuide={() => setIsVsCodeGuideOpen(true)}
          onSignOut={() => { void handleSignOut(); }}
          pendingLoanCount={pendingLoans.length}
        />

        {databaseError && (
          <div role="alert" className="mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {databaseError}
          </div>
        )}

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
                    activeMembersCount={members.length}
                    paidMembersCount={12}
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
              <h2 className="text-xl font-bold text-slate-900">Pochi la Biashara Payments</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Guide members to pay your Pochi business number, then record payments only after verifying them in the recipient account.
              </p>
              <button
                onClick={() => setIsMpesaSimOpen(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
              >
                Record a Pochi Payment
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
        members={members}
        onAddContribution={handleAddContribution}
      />

      <LoanRequestModal
        isOpen={isRequestLoanOpen}
        onClose={() => setIsRequestLoanOpen(false)}
        members={members}
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
        members={members}
        onVerifiedPayment={handleMpesaPayment}
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
