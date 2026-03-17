// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Github } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROLES } from '../utils/constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const labelClass = isDark ? 'text-gray-300' : 'text-slate-700';
  const iconClass = isDark ? 'text-gray-400' : 'text-slate-400';
  const inputClass = `block w-full rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
    isDark
      ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-400'
      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DEVPORTIX</span>
          </Link>
          <h2 className={`mt-6 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sign in to your account</h2>
        </div>

        <div className={`backdrop-blur-sm rounded-xl p-8 border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white/90 border-slate-200 shadow-lg shadow-slate-200/40'
        }`}>
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:text-red-400 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className={`block text-sm font-medium ${labelClass}`}>Email</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className={`w-5 h-5 ${iconClass}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} pl-10 pr-3 py-3`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass}`}>Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className={`w-5 h-5 ${iconClass}`} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pl-10 pr-3 py-3`}
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${
                    isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-300 bg-white'
                  }`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm ${labelClass}`}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Demo Account
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-slate-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-slate-500'}`}>
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button className={`flex items-center justify-center w-full py-3 px-4 rounded-lg transition ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}>
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </button>
            </div>
          </div>

          <p className={`mt-6 text-center ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-400">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
