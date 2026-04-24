import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailCheck, RefreshCcw, TriangleAlert } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/authApi';

const DEFAULT_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams]);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [status, setStatus] = useState(token ? 'verifying' : 'invalid');
  const [message, setMessage] = useState(token ? 'Checking your verification link...' : 'This verification link is missing a token.');
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isMounted = true;

    const runVerification = async () => {
      try {
        const response = await authApi.verifyEmail({ token });
        if (!isMounted) {
          return;
        }
        setStatus('success');
        setEmail(response?.email || '');
        setMessage(response?.message || 'Your email has been verified successfully.');
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setStatus('error');
        setEmail(err?.payload?.email || '');
        setMessage(err.message || 'We could not verify this email link.');
      }
    };

    runVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (status !== 'success') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate(`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`, { replace: true });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [status, navigate, email]);

  useEffect(() => {
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
      setMessage('This link can no longer be recovered automatically. Please return to sign in and request a fresh verification email.');
      return;
    }

    setBusy(true);

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
      setMessage(`A new verification link has been sent to ${email}.`);
    } catch (err) {
      if (err.status === 429) {
        setCooldown(Math.max(1, Number(err.retryAfterSeconds || DEFAULT_COOLDOWN_SECONDS)));
      }
      setMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setBusy(false);
    }
  };

  const icon = status === 'success'
    ? <CheckCircle2 className="h-8 w-8" />
    : status === 'verifying'
      ? <MailCheck className="h-8 w-8" />
      : <TriangleAlert className="h-8 w-8" />;

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${isDark ? 'bg-[linear-gradient(145deg,#020617_0%,#0f172a_34%,#1d4ed8_72%,#312e81_100%)]' : 'bg-[linear-gradient(145deg,#eff6ff_0%,#e0f2fe_44%,#ede9fe_100%)]'}`}>
      <div className={`mx-auto max-w-2xl rounded-[2rem] border p-8 sm:p-10 ${isDark ? 'border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.94),rgba(15,23,42,0.92),rgba(30,64,175,0.12))] text-white shadow-[0_28px_80px_rgba(2,6,23,0.45)]' : 'border-white/70 bg-white/90 text-slate-900 shadow-[0_28px_80px_rgba(148,163,184,0.26)]'}`}>
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${status === 'success' ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : status === 'verifying' ? (isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-100 text-sky-700') : (isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700')}`}>
          {icon}
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold">
          {status === 'success' ? 'Email verified' : status === 'verifying' ? 'Verifying your email' : 'Verification issue'}
        </h1>
        <p className={`mt-4 text-center text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {message}
        </p>

        {status === 'success' ? (
          <p className={`mt-3 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Redirecting you to sign in in a few seconds...
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {status !== 'verifying' ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={busy || cooldown > 0}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new verification link'}
            </button>
          ) : null}

          <Link
            to={email ? `/login?email=${encodeURIComponent(email)}` : '/login'}
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

export default VerifyEmail;
