import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  PiggyBank, 
  HandCoins, 
  Smartphone, 
  Users, 
  CheckCircle2, 
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface LandingPageViewProps {
  onGoToDashboard: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onGoToDashboard, onLogin, onSignUp }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Banner Notice */}
      <div className="bg-emerald-950/80 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Previewing Akiba Landing Page (index.html) • Connected to Chama Dashboard</span>
        <button
          onClick={onGoToDashboard}
          className="ml-2 font-bold underline hover:text-white cursor-pointer"
        >
          Launch Dashboard &rarr;
        </button>
      </div>

      {/* Navigation */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            A
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Akiba<span className="text-emerald-400">.ke</span>
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
              Smart Chama Platform
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm text-slate-300 font-medium">
          <a href="#features" className="hover:text-emerald-400 transition">Features</a>
          <a href="#mpesa" className="hover:text-emerald-400 transition">M-Pesa Automation</a>
          <a href="#transparency" className="hover:text-emerald-400 transition">Table Banking</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-white text-sm font-bold transition"
          >
            Log in
          </button>
          <button
            onClick={onSignUp}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>Sign up</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Kenyan Chama Management • Transparent & Automated</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Manage your Chama savings, loans & merry-go-round with{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            100% peace of mind.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Say goodbye to messy paper ledgers and manual WhatsApp tracking. Akiba automates monthly contributions, loan approvals, interest calculations, and instant M-Pesa notifications.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onSignUp}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base transition shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create your account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 hover:border-emerald-400 text-white font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Open dashboard</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {[
            { title: 'Pochi Payments', desc: 'Manual receipt verification before ledger credit', icon: Smartphone },
            { title: 'Loan Manager', desc: 'Custom Chama interest & guarantors', icon: HandCoins },
            { title: 'Merry-Go-Round Rota', desc: 'Automated turn payout schedule', icon: Users },
            { title: 'Audited Statements', desc: '1-click PDF/CSV reports for AGMs', icon: PiggyBank },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Icon className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="font-bold text-white text-sm">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>Akiba Chama Management System &copy; 2026 • Built for Kenyan Investment Groups & Welfare Societies</p>
      </footer>
    </div>
  );
};
