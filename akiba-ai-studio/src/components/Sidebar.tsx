import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PiggyBank, 
  HandCoins, 
  Smartphone, 
  FileSpreadsheet, 
  Code2, 
  Settings, 
  LogOut,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenVsCodeGuide: () => void;
  onToggleLandingPage: () => void;
  memberCount: number;
  pendingLoanCount: number;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenVsCodeGuide,
  onToggleLandingPage,
  memberCount,
  pendingLoanCount,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Chama Members', icon: Users, badge: memberCount > 0 ? String(memberCount) : undefined },
    { id: 'contributions', label: 'Contributions', icon: PiggyBank },
    { id: 'loans', label: 'Loans & Repayments', icon: HandCoins, badge: pendingLoanCount > 0 ? `${pendingLoanCount} pending` : undefined },
    { id: 'mpesa', label: 'M-Pesa STK Simulator', icon: Smartphone, highlight: true },
    { id: 'reports', label: 'Statements & Reports', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-slate-800 shadow-xl select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/akiba-landing/assets/akiba-logo.png"
            alt="Akiba"
            className="w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20"
          />
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight flex items-center gap-1.5">
              Akiba <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30">Chama</span>
            </h1>
            <p className="text-[11px] text-slate-400">Financial Hub & Ledger</p>
          </div>
        </div>
      </div>

      {/* Chama Quick Status */}
      <div className="mx-4 my-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>Current Cycle</span>
          <span className="text-emerald-400 font-semibold">{memberCount > 0 ? 'Active' : 'Not set up'}</span>
        </div>
        <p className="text-white font-medium">Your Chama</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{memberCount} registered members</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <div className="text-[10px] uppercase font-semibold text-slate-400 px-3 py-1 tracking-wider">
          Main Menu
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${item.highlight && !isActive ? 'border border-emerald-500/30 text-emerald-300 bg-emerald-950/30' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="text-[10px] uppercase font-semibold text-slate-400 px-3 pt-4 pb-1 tracking-wider">
          Developer Tools
        </div>
        <button
          onClick={onOpenVsCodeGuide}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-amber-300 bg-amber-950/20 border border-amber-500/20 hover:bg-amber-950/40 transition-all text-left"
        >
          <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span>VS Code Windows Guide</span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded">Help</span>
            </div>
            <p className="text-[10px] text-amber-400/70 font-normal">Inspect dashboard.html & AI</p>
          </div>
        </button>

        <button
          onClick={onToggleLandingPage}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Switch to Landing Page
          </span>
          <span className="text-[10px] text-slate-500">index.html</span>
        </button>
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-blue-300 text-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Admin</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Chama Admin
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );
};
