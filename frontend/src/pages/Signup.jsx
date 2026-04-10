// src/pages/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROLES } from '../utils/constants';
import { authApi } from '../services/authApi';
import AuthShowcase from '../components/AuthShowcase';

const Signup = () => {
  const OTP_RESEND_COOLDOWN_SECONDS = 60;
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    githubUsername: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signup } = useAuth();
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'email') {
      setOtpMessage('');
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  React.useEffect(() => {
    if (otpCooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setOtpCooldown((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  const handleRequestOtp = async () => {
    setError('');
    setOtpMessage('');

    try {
      if (!formData.email) {
        throw new Error('Enter your email address first');
      }

      if (otpCooldown > 0) {
        throw new Error(`Please wait ${otpCooldown}s before requesting another OTP`);
      }

      setOtpLoading(true);
      await authApi.requestRegistrationOtp({ email: formData.email });
      setOtpMessage(`A registration OTP has been sent to ${formData.email}.`);
      setOtpCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err.status === 429) {
        setOtpCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      }
      setError(err.message || 'Failed to send registration OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.otp) {
        throw new Error('Please fill in all required fields including the OTP');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (!formData.role) {
        throw new Error('Please select a role');
      }

      if (!termsAccepted) {
        throw new Error('Please accept the terms and conditions');
      }

      await signup({
        email: formData.email,
        fullName: formData.fullName || 'New User',
        password: formData.password,
        otp: formData.otp,
        githubUsername: formData.githubUsername || '',
        role: formData.role,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${isDark ? 'bg-[linear-gradient(145deg,#020617_0%,#0f172a_34%,#1d4ed8_72%,#312e81_100%)]' : 'bg-[linear-gradient(145deg,#eff6ff_0%,#e0f2fe_44%,#ede9fe_100%)]'}`}>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
        <AuthShowcase mode="signup" isDark={isDark} />

        <section className={`auth-form-preserve relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 lg:p-10 ${
          isDark
            ? 'border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.94),rgba(15,23,42,0.92),rgba(30,64,175,0.12))] shadow-[0_28px_80px_rgba(2,6,23,0.45)]'
            : 'border-white/70 bg-white/88 shadow-[0_28px_80px_rgba(148,163,184,0.26)]'
        }`}>
          <div className={`absolute inset-x-0 top-0 h-28 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_65%)]' : 'bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.18),transparent_65%)]'}`} />

          <div className="relative">
            <div className="animate-in slide-in-from-bottom duration-700 delay-100">
              <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Create Account</p>
              <h1 className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Start your DevPortix workspace</h1>
              <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Verify your email, choose your role, and begin building a portfolio story that feels structured from day one.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in slide-in-from-bottom duration-500">
                {error}
              </div>
            ) : null}

            <form className="mt-6 space-y-5 animate-in slide-in-from-bottom duration-700 delay-300" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={`block text-sm font-medium ${labelClass}`}>Full Name</label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <User className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${labelClass}`}>Role</label>
                  <div className="relative mt-2">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`block w-full rounded-2xl border px-4 py-3.5 text-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/10 ${
                        isDark
                          ? 'bg-slate-950/80 border-slate-700 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                      required
                    >
                      <option value="">Select role</option>
                      <option value={ROLES.STUDENT}>Student</option>
                      <option value={ROLES.INSTRUCTOR}>Instructor / Mentor</option>
                      <option value={ROLES.ORGANIZATION}>Organization</option>
                      <option value={ROLES.PROFESSIONAL}>Professional</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${labelClass}`}>Email</label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className={`h-5 w-5 ${iconClass}`} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpLoading || otpCooldown > 0}
                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-600 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {otpLoading ? 'Sending OTP...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
                  </button>
                  {otpMessage ? (
                    <span className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{otpMessage}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={`block text-sm font-medium ${labelClass}`}>Email OTP</label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className={`${inputClass} tracking-[0.28em]`}
                      placeholder="123456"
                      inputMode="numeric"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${labelClass}`}>GitHub Username</label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Github className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <input
                      type="text"
                      name="githubUsername"
                      value={formData.githubUsername}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="yourusername"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={`block text-sm font-medium ${labelClass}`}>Password</label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${labelClass}`}>Confirm Password</label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-sky-100 bg-sky-50/80'}`}>
                <label className={`flex items-start gap-3 text-sm leading-7 ${labelClass}`}>
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className={`mt-1 h-4 w-4 rounded border ${isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'}`}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#" className="font-medium text-sky-600 transition hover:text-sky-500">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-medium text-sky-600 transition hover:text-sky-500">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || otpLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className={`mt-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-600 transition hover:text-sky-500">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signup;
