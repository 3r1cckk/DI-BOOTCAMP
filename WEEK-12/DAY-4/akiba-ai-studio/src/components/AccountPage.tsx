import { useState } from 'react';
import { ArrowLeft, KeyRound, UserPlus } from 'lucide-react';

export type AccountMode = 'login' | 'signup';

interface AccountPageProps {
  mode: AccountMode;
  onBack: () => void;
  onModeChange: (mode: AccountMode) => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function AccountPage({ mode, onBack, onModeChange, onSubmit }: AccountPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to access your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Akiba
        </button>

        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
            {isSignUp ? <UserPlus className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-bold">{isSignUp ? 'Create your Akiba account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isSignUp ? 'Create an account to access the chama dashboard.' : 'Log in to continue to the chama dashboard.'}
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-sm text-rose-300">
            {errorMessage}
          </p>
        )}

        <label className="block space-y-1.5 text-sm font-medium text-slate-200">
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-slate-200">
          Password
          <input
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? 10 : undefined}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
          />
          {isSignUp && <span className="block text-xs text-slate-400">Use at least 10 characters.</span>}
        </label>

        {isSignUp && (
          <label className="block space-y-1.5 text-sm font-medium text-slate-200">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              maxLength={128}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Log in'}
        </button>

        <p className="text-center text-sm text-slate-400">
          {isSignUp ? 'Already have an account?' : 'New to Akiba?'}{' '}
          <button
            type="button"
            onClick={() => onModeChange(isSignUp ? 'login' : 'signup')}
            className="font-semibold text-emerald-400 hover:text-emerald-300"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>
        <p className="text-center text-xs text-slate-500">
          Accounts on this local installation share the same chama records.
        </p>
      </form>
    </main>
  );
}
