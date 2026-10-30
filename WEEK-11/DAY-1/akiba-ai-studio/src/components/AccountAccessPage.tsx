import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AccountAccessPageProps {
  onAuthenticated: (user: AuthenticatedUser) => void;
  onBackToLanding: () => void;
  initialError?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'treasurer' | 'secretary' | 'chairperson' | 'admin';
  activeChama: { id: string; name: string };
  membershipId: string;
}

interface ChamaChoice {
  chamaId: string;
  chamaName: string;
  role: AuthenticatedUser['role'];
  status: string;
}

type AccountMode = 'login' | 'setup' | 'forgot' | 'reset' | 'invite';

const resetTokenFromUrl = () =>
  new URLSearchParams(window.location.hash.slice(1)).get('reset_token') || '';

const invitationTokenFromUrl = () =>
  new URLSearchParams(window.location.hash.slice(1)).get('invite_token') || '';

interface InvitationDetails {
  name: string;
  phoneOrEmail: string;
  role: AuthenticatedUser['role'];
  chamaName: string;
  requiresEmail: boolean;
}

export const AccountAccessPage: React.FC<AccountAccessPageProps> = ({
  onAuthenticated,
  onBackToLanding,
  initialError = '',
}) => {
  const [resetToken, setResetToken] = useState(resetTokenFromUrl);
  const [inviteToken, setInviteToken] = useState(invitationTokenFromUrl);
  const [mode, setMode] = useState<AccountMode>(() =>
    invitationTokenFromUrl() ? 'invite' : resetTokenFromUrl() ? 'reset' : 'setup'
  );
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [chamaChoices, setChamaChoices] = useState<ChamaChoice[]>([]);
  const [selectedChamaId, setSelectedChamaId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [chamaName, setChamaName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const registering = mode === 'setup';
  const loggingIn = mode === 'login';
  const resetting = mode === 'reset';
  const inviting = mode === 'invite';

  React.useEffect(() => {
    if (!inviteToken) return;
    let active = true;
    fetch(`/api/auth/invites/${encodeURIComponent(inviteToken)}`, { credentials: 'same-origin' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'This invitation is not available.');
        return result as InvitationDetails;
      })
      .then((details) => {
        if (!active) return;
        setInvitation(details);
        if (!details.requiresEmail) setInviteEmail(details.phoneOrEmail);
      })
      .catch((inviteError: unknown) => {
        if (active) setError(inviteError instanceof Error ? inviteError.message : 'This invitation is not available.');
      });
    return () => {
      active = false;
    };
  }, [inviteToken]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if ((registering || resetting || inviting) && password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    const endpoint = registering
      ? '/api/auth/register'
      : inviting
        ? '/api/auth/accept-invitation'
      : resetting
        ? '/api/auth/reset-password'
        : mode === 'forgot'
          ? '/api/auth/forgot-password'
          : '/api/auth/login';
    const payload = registering
      ? { name: name.trim(), email: email.trim(), phone: phone.trim(), password, chamaName: chamaName.trim() || 'My Chama' }
      : inviting
        ? { token: inviteToken, password, ...(invitation?.requiresEmail ? { email: inviteEmail.trim() } : {}) }
      : resetting
        ? { token: resetToken, password }
        : { email: email.trim(), ...(mode === 'forgot' ? {} : { password, ...(selectedChamaId ? { chamaId: selectedChamaId } : {}) }) };

    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(typeof result.error === 'string' ? result.error : 'We could not complete the request.');
        return;
      }

      if (mode === 'forgot') {
        setMessage(result.message);
        return;
      }
      if (resetting) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        setResetToken('');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setMessage(result.message);
        return;
      }
      if (inviting) {
        if (!isAuthenticatedUser(result.user)) {
          setError('The account service returned an invalid invitation response.');
          return;
        }
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        setInviteToken('');
        onAuthenticated(result.user);
        return;
      }
      if (result.requiresChamaSelection === true && Array.isArray(result.memberships)) {
        setChamaChoices(result.memberships);
        setSelectedChamaId(result.memberships[0]?.chamaId || '');
        setMessage('Select the chama you want to open, then continue.');
        return;
      }
      if (!isAuthenticatedUser(result.user)) {
        setError('The account service returned an invalid login response.');
        return;
      }
      onAuthenticated(result.user);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? `Akiba could not reach its account service: ${submitError.message}`
          : 'Akiba could not reach its account service. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
    if (!value || typeof value !== 'object') return false;
    const user = value as Record<string, unknown>;
    return typeof user.id === 'string' &&
      typeof user.name === 'string' &&
      typeof user.email === 'string' &&
      ['member', 'treasurer', 'secretary', 'chairperson', 'admin'].includes(String(user.role)) &&
      Boolean(user.activeChama && typeof user.activeChama === 'object' &&
        typeof (user.activeChama as Record<string, unknown>).id === 'string' &&
        typeof (user.activeChama as Record<string, unknown>).name === 'string') &&
      typeof user.membershipId === 'string';
  }

  const switchMode = (nextMode: AccountMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
    if (nextMode !== 'login') {
      setChamaChoices([]);
      setSelectedChamaId('');
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9ff] px-5 py-10 text-[#102149]">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col items-center justify-center">
        <button
          type="button"
          onClick={onBackToLanding}
          className="mb-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Akiba
        </button>

        <section className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5 md:grid-cols-2">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-[#0d754f] to-[#123b55] p-10 text-white md:flex">
            <img
              src="/akiba-landing/assets/akiba-logo.png"
              alt="Akiba"
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                Your chama workspace
              </p>
              <h1 className="text-4xl font-extrabold leading-tight">
                Grow together.<br />Manage with clarity.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
                Sign in or create an account to continue to the Akiba platform.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Password reset links are private, time-limited, and single-use.
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {loggingIn || registering ? (
              <div className="mb-8 flex gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    loggingIn ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('setup')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    registering ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create new chama
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to log in
              </button>
            )}

            <h2 className="text-2xl font-extrabold">
              {registering
                ? 'Set up your chama'
                : resetting
                  ? 'Choose a new password'
                  : inviting
                    ? 'Accept your invitation'
                  : mode === 'forgot'
                    ? 'Recover your password'
                    : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {registering
                ? 'Start a new chama. Your account will be its admin.'
                : resetting
                  ? 'Enter a new password for your Akiba account.'
                  : inviting
                    ? 'Choose a password to create your member account. Your role is assigned by the chama admin.'
                  : mode === 'forgot'
                    ? 'We’ll email you a secure link to reset your password.'
                    : 'Sign in once to open the chama and role linked to your membership.'}
            </p>

            {registering && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                This creates a separate chama. It will not recover or give access to records in an existing chama.
              </p>
            )}

            {inviting && invitation && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <p className="font-bold">{invitation.name} · {invitation.chamaName}</p>
                <p className="mt-1 text-xs text-blue-800">
                  Invited as {invitation.role}. Contact: {invitation.phoneOrEmail}
                </p>
              </div>
            )}

            <form className="mt-7 space-y-4" onSubmit={submit}>
              {registering && (
                <label className="block text-sm font-semibold text-slate-700">
                  Your name
                  <input
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    maxLength={80}
                    minLength={2}
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </label>
              )}
              {registering && (
                <label className="block text-sm font-semibold text-slate-700">
                  Phone number (optional)
                  <input
                    autoComplete="tel"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    maxLength={30}
                    onChange={(event) => setPhone(event.target.value)}
                    value={phone}
                  />
                </label>
              )}
              {registering && (
                <label className="block text-sm font-semibold text-slate-700">
                  Chama name
                  <input
                    autoComplete="organization"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    maxLength={100}
                    minLength={2}
                    onChange={(event) => setChamaName(event.target.value)}
                    value={chamaName}
                  />
                </label>
              )}
              {!resetting && (!inviting || invitation?.requiresEmail) && (
                <label className="block text-sm font-semibold text-slate-700">
                  {inviting ? 'Email address for your login' : 'Email address'}
                  <input
                    autoComplete="email"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    maxLength={254}
                    onChange={(event) => inviting ? setInviteEmail(event.target.value) : setEmail(event.target.value)}
                    required
                    type="email"
                    value={inviting ? inviteEmail : email}
                  />
                </label>
              )}
              {mode !== 'forgot' && (
                <label className="block text-sm font-semibold text-slate-700">
                  {resetting ? 'New password' : inviting ? 'Choose a password' : 'Password'}
                  <div className="relative mt-1.5">
                    <input
                      autoComplete={registering || resetting || inviting ? 'new-password' : 'current-password'}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      maxLength={128}
                      minLength={8}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-700"
                      onClick={() => setShowPassword((visible) => !visible)}
                      type="button"
                    >
                      {showPassword
                        ? <EyeOff aria-hidden="true" className="h-5 w-5" />
                        : <Eye aria-hidden="true" className="h-5 w-5" />}
                    </button>
                  </div>
                  {(registering || resetting || inviting) && (
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      Use at least 8 characters, including a letter and a number.
                    </span>
                  )}
                  {loggingIn && chamaChoices.length > 0 && (
                    <label className="block text-sm font-semibold text-slate-700">
                      Chama to open
                      <select
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) => setSelectedChamaId(event.target.value)}
                        required
                        value={selectedChamaId}
                      >
                        {chamaChoices.map((choice) => (
                          <option key={choice.chamaId} value={choice.chamaId}>
                            {choice.chamaName} · {choice.role}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </label>
              )}
              {(registering || resetting || inviting) && (
                <label className="block text-sm font-semibold text-slate-700">
                  Confirm password
                  <div className="relative mt-1.5">
                    <input
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      maxLength={128}
                      minLength={8}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                    />
                    <button
                      aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                      aria-pressed={showConfirmPassword}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-700"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      type="button"
                    >
                      {showConfirmPassword
                        ? <EyeOff aria-hidden="true" className="h-5 w-5" />
                        : <Eye aria-hidden="true" className="h-5 w-5" />}
                    </button>
                  </div>
                </label>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                  {message}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                disabled={busy || (inviting && !invitation)}
                type="submit"
              >
                {busy
                  ? 'Please wait…'
                  : registering
                    ? 'Set up chama'
                    : inviting
                      ? 'Accept invitation'
                    : resetting
                      ? 'Reset password'
                      : mode === 'forgot'
                        ? 'Send recovery email'
                        : chamaChoices.length > 0 ? 'Open selected chama' : 'Log in'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {loggingIn && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="mt-4 w-full text-center text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Forgot your password?
              </button>
            )}

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              {inviting
                ? 'Invitation links expire after 48 hours and can only be used once.'
                : 'Password recovery is sent by email. Reset links expire after 30 minutes and work once.'}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
