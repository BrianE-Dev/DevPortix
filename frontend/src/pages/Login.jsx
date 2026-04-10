// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROLES } from '../utils/constants';
import BrandLogo from '../components/BrandLogo';
import AuthShowcase from '../components/AuthShowcase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const labelClass = isDark ? 'text-slate-300' : 'text-slate-700';
  const iconClass = isDark ? 'text-slate-400' : 'text-slate-400';
  const inputClass = `block w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/10 ${
    isDark
      ? 'bg-slate-950/80 border-slate-700 text-white placeholder-slate-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const demoEmail = 'demo@devportix.com';
      const demoPassword = 'demo12345';

      try {
        await login(demoEmail, demoPassword);
      } catch {
        await signup({
          fullName: 'Demo Developer',
          email: demoEmail,
          password: demoPassword,
          role: ROLES.PROFESSIONAL,
          githubUsername: 'demodeveloper',
        });
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${isDark ? 'bg-[linear-gradient(145deg,#020617_0%,#0f172a_38%,#1e1b4b_100%)]' : 'bg-[linear-gradient(145deg,#eff6ff_0%,#e0f2fe_44%,#ede9fe_100%)]'}`}>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <AuthShowcase mode="login" isDark={isDark} />

        <section className={`auth-form-preserve relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 lg:p-10 ${
          isDark
            ? 'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.92))] shadow-[0_28px_80px_rgba(2,6,23,0.45)]'
            : 'border-white/70 bg-white/88 shadow-[0_28px_80px_rgba(148,163,184,0.26)]'
        }`}>
          <div className={`absolute inset-x-0 top-0 h-28 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_65%)]' : 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_65%)]'}`} />

          <div className="relative">
            <div className="animate-in slide-in-from-top duration-700">
              <Link to="/" className="inline-flex items-center">
                <BrandLogo className="h-11 w-auto max-w-[11rem]" alt="DevPortix logo" />
              </Link>
            </div>

            <div className="mt-8 animate-in slide-in-from-bottom duration-700 delay-100">
              <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Sign In</p>
              <h1 className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome back to DevPortix</h1>
              <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Access your workspace, continue building your portfolio, and keep your proof of work moving.
              </p>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm animate-in slide-in-from-bottom duration-700 delay-300">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Quick access</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-emerald-400/12 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Secure login</span>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in slide-in-from-bottom duration-500">
                {error}
              </div>
            ) : null}

            <form className="mt-6 space-y-5 animate-in slide-in-from-bottom duration-700 delay-500" onSubmit={handleSubmit}>
              <div>
                <label className={`block text-sm font-medium ${labelClass}`}>Email</label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className={`h-5 w-5 ${iconClass}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className={`block text-sm font-medium ${labelClass}`}>Password</label>
                  <a href="#" className="text-sm font-medium text-sky-600 transition hover:text-sky-500">
                    Forgot password?
                  </a>
                </div>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className={`h-5 w-5 ${iconClass}`} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className={`flex items-center gap-2 text-sm ${labelClass}`}>
                  <input
                    id="remember-me"
                    type="checkbox"
                    className={`h-4 w-4 rounded border ${isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`}
                  />
                  Remember me
                </label>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Protected with secure session checks</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Please wait...' : 'Try Demo Account'}
              </button>
            </form>

            <div className="mt-8 animate-in slide-in-from-bottom duration-700 delay-700">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-3 ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}`}>Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                className={`mt-6 flex w-full items-center justify-center rounded-2xl border px-4 py-3.5 text-sm font-medium transition ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </button>
            </div>

            <p className={`mt-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-sky-600 transition hover:text-sky-500">
                Create one
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
