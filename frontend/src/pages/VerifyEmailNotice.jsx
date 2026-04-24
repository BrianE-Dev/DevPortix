import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCcw } from 'lucide-react';
import { authApi } from '../services/authApi';
import { useTheme } from '../hooks/useTheme';

const DEFAULT_COOLDOWN_SECONDS = 60;

const VerifyEmailNotice = () => {
  const [searchParams] = useSearchParams();
  const email = useMemo(() => String(searchParams.get('email') || '').trim(), [searchParams]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [message, setMessage] = useState(
    email ? `We sent a verification link to ${email}.` : 'Check your inbox for your verification link.',
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldown((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setError('We need your email address to resend the verification link.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await authApi.resendVerificationEmail({ email });
      const cooldownEndsAt = response?.cooldownEndsAt
        ? new Date(response.cooldownEndsAt).getTime() - Date.now()
        : 0;
      setCooldown(
        cooldownEndsAt > 0
          ? Math.max(1, Math.ceil(cooldownEndsAt / 1000))
          : DEFAULT_COOLDOWN_SECONDS,
      );
      setMessage(`A fresh verification link has been sent to ${email}.`);
    } catch (err) {
      if (err.status === 429) {
        setCooldown(Math.max(1, Number(err.retryAfterSeconds || DEFAULT_COOLDOWN_SECONDS)));
      }
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${isDark ? 'bg-[linear-gradient(145deg,#020617_0%,#0f172a_34%,#1d4ed8_72%,#312e81_100%)]' : 'bg-[linear-gradient(145deg,#eff6ff_0%,#e0f2fe_44%,#ede9fe_100%)]'}`}>
      <div className={`mx-auto max-w-2xl rounded-[2rem] border p-8 sm:p-10 ${isDark ? 'border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.94),rgba(15,23,42,0.92),rgba(30,64,175,0.12))] text-white shadow-[0_28px_80px_rgba(2,6,23,0.45)]' : 'border-white/70 bg-white/90 text-slate-900 shadow-[0_28px_80px_rgba(148,163,184,0.26)]'}`}>
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
          <Mail className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold">Verify your email</h1>
        <p className={`mt-4 text-center text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          We’ve created your account, but you’ll need to confirm your email address before you can sign in.
        </p>

        <div className={`mt-8 rounded-[1.5rem] border px-5 py-4 text-sm ${isDark ? 'border-sky-400/20 bg-sky-500/10 text-slate-100' : 'border-sky-200 bg-sky-50 text-slate-700'}`}>
          {message}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={handleResend}
            disabled={busy || cooldown > 0}
            className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </button>
          <Link
            to="/login"
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'}`}
          >
            <RefreshCcw className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailNotice;
