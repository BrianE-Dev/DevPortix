// src/pages/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Github, Code2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROLES } from '../utils/constants';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    githubUsername: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signup } = useAuth();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('Please fill in all required fields');
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
        githubUsername: formData.githubUsername || '',
        role: formData.role,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Code2 className="w-10 h-10 text-blue-400" />
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DEVPORTIX</span>
          </Link>
          <h2 className={`mt-6 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create your account</h2>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Start building your portfolio today</p>
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
              <label className={`block text-sm font-medium ${labelClass}`}>Full Name</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className={`w-5 h-5 ${iconClass}`} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`${inputClass} pl-10 pr-3 py-3`}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass}`}>Email</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className={`w-5 h-5 ${iconClass}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} pl-10 pr-3 py-3`}
                  placeholder="********"
                  required
                />
              </div>
              <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass}`}>Confirm Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className={`w-5 h-5 ${iconClass}`} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${inputClass} pl-10 pr-3 py-3`}
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass}`}>Role</label>
              <div className="relative mt-1">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`${inputClass} px-3 py-3`}
                  required
                >
                  <option value="">Select your role</option>
                  <option value={ROLES.STUDENT}>Student</option>
                  <option value={ROLES.INSTRUCTOR}>Instructor / Mentor</option>
                  <option value={ROLES.ORGANIZATION}>Organization</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass}`}>GitHub Username (Optional)</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Github className={`w-5 h-5 ${iconClass}`} />
                </div>
                <input
                  type="text"
                  name="githubUsername"
                  value={formData.githubUsername}
                  onChange={handleChange}
                  className={`${inputClass} pl-10 pr-3 py-3`}
                  placeholder="yourusername"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${
                  isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-300 bg-white'
                }`}
              />
              <label htmlFor="terms" className={`ml-2 block text-sm ${labelClass}`}>
                I agree to the{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className={`mt-6 text-center ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
