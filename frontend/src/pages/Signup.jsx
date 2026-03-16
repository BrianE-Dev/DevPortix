// src/pages/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Github, Code2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/authApi';
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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'email') {
      setOtpSent(false);
      setEmailVerified(false);
      setRegistrationToken('');
      setOtpValue('');
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');

    if (!formData.email) {
      setError('Enter your email first.');
      return;
    }

    setOtpLoading(true);
    try {
      await authApi.requestRegistrationOtp(formData.email);
      setOtpSent(true);
      setEmailVerified(false);
      setRegistrationToken('');
      setSuccess('OTP sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    if (!formData.email || !otpValue) {
      setError('Enter your email and OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await authApi.verifyRegistrationOtp(formData.email, otpValue);
      const token = response?.data?.registrationToken || '';
      if (!token) {
        throw new Error('OTP verified but no registration token returned.');
      }
      setRegistrationToken(token);
      setEmailVerified(true);
      setSuccess('Email verified. You can now create your account.');
    } catch (err) {
      setEmailVerified(false);
      setRegistrationToken('');
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
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

      if (!emailVerified || !registrationToken) {
        throw new Error('Verify your email OTP before creating an account.');
      }

      await signup({
        email: formData.email,
        fullName: formData.fullName || 'New User',
        password: formData.password,
        githubUsername: formData.githubUsername || '',
        role: formData.role,
        registrationToken,
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
            <span className="text-2xl font-bold text-white">DEVPORTIX</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-gray-400">Start building your portfolio today</p>
        </div>
        
        <div className="auth-form-preserve bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:text-red-400 dark:bg-red-900/20">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:text-green-300 dark:bg-green-900/20">
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || !otpSent}
                  className="px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                {emailVerified ? 'Email verified for registration' : 'Verify email to continue registration'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Role</label>
              <div className="relative mt-1">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-300">GitHub Username (Optional)</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Github className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="githubUsername"
                  value={formData.githubUsername}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-900"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
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
          
          <p className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">
                  Or sign up with
                </span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </button>
              <button
                type="button"
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              >
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
