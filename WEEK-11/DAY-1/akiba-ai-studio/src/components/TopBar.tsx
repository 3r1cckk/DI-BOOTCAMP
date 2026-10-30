import React from 'react';
import { Search, Bell, HelpCircle, Shield, Calendar, Terminal } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenVsCodeGuide: () => void;
  pendingLoanCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenVsCodeGuide,
  pendingLoanCount,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96 max-w-full">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members, M-Pesa receipts, loans..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Quick VS Code assistant pill */}
        <button
          onClick={onOpenVsCodeGuide}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-medium transition"
          title="Open VS Code Windows helper & dashboard.html inspector"
        >
          <Terminal className="w-3.5 h-3.5 text-amber-600" />
          <span>VS Code Helper</span>
          <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            Ctrl+P
          </span>
        </button>

        {/* Date / Chama Cycle Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })} Cycle</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            aria-label="Notifications"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition"
          >
            <Bell className="w-5 h-5" />
            {pendingLoanCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            A
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-900">Admin</p>
            <p className="text-[11px] text-slate-500">Chama Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};
