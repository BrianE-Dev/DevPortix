const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const PortfolioSettings = require('../modules/portfolioSettings');
const OtpToken = require('../modules/otpToken');

const TOKEN_TTL = '7d';
const PUBLIC_SIGNUP_ROLES = new Set(['student', 'instructor', 'organization', 'professional']);
const OTP_PURPOSE_REGISTRATION = 'registration';
const EMAIL_SERVICE_URL = String(process.env.EMAIL_SERVICE_URL || '').trim().replace(/\/+$/, '');
const OTP_REQUEST_TIMEOUT_MS = Number(process.env.OTP_REQUEST_TIMEOUT_MS || 15000);

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET || 'devportix_dev_secret', {
    expiresIn: TOKEN_TTL,
  });

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const hashOtp = (email, purpose, otp) =>
  crypto
    .createHash('sha256')
    .update(`${normalizeEmail(email)}:${String(purpose || '').trim().toLowerCase()}:${String(otp)}`)
    .digest('hex');
const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

const toPublicUser = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  githubUsername: userDoc.githubUsername,
  avatar: userDoc.avatar,
  bio: userDoc.bio || '',
  subscription: userDoc.subscription,
  subscriptionBillingCycle: userDoc.subscriptionBillingCycle || 'monthly',
  skills: Array.isArray(userDoc.skills) ? userDoc.skills : [],
  dashboardMenu: userDoc.dashboardMenu || {},
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

const requestRegistrationOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    if (!EMAIL_SERVICE_URL) {
      return res.status(503).json({ message: 'Email service unavailable' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OTP_REQUEST_TIMEOUT_MS);

    const response = await fetch(`${EMAIL_SERVICE_URL}/api/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        purpose: OTP_PURPOSE_REGISTRATION,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const payload = await parseJsonSafely(response);
    if (!response.ok) {
      const upstreamMessage = payload?.message || 'Failed to send registration OTP';

      if (response.status === 429) {
        return res.status(429).json({
          message: 'Too many OTP requests. Please wait a minute before trying again.',
        });
      }

      if (response.status >= 500) {
        console.error(
          `[auth] OTP request failed via email service (${response.status}): ${payload?.error || upstreamMessage}`
        );
        return res.status(503).json({
          message: 'OTP service is temporarily unavailable. Please try again shortly.',
        });
      }

      return res.status(response.status).json({
        message: upstreamMessage,
      });
    }

    return res.status(200).json(payload || { message: 'OTP sent successfully' });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[auth] OTP request to email service timed out');
      return res.status(504).json({
        message: 'OTP request timed out. Please try again shortly.',
      });
    }

    console.error('[auth] Failed to send registration OTP:', error.message);
    return res.status(503).json({
      message: 'OTP service is temporarily unavailable. Please try again shortly.',
    });
  }
};

const register = async (req, res) => {
  try {
    const { fullName, email, password, role, githubUsername, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ message: 'Email, password, and OTP are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const otpDoc = await OtpToken.findOne({
      email: normalizedEmail,
      purpose: OTP_PURPOSE_REGISTRATION,
    });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Request a registration OTP before creating your account' });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      return res.status(410).json({ message: 'Your registration OTP has expired. Request a new code.' });
    }

    const submittedHash = hashOtp(normalizedEmail, OTP_PURPOSE_REGISTRATION, otp);
    if (submittedHash !== otpDoc.codeHash) {
      otpDoc.attempts = Number(otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: 'Invalid registration OTP' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const normalizedRole = String(role || 'student').trim().toLowerCase();
    const assignedRole = PUBLIC_SIGNUP_ROLES.has(normalizedRole) ? normalizedRole : 'student';
    const defaultPlan = 'free';
    const defaultBillingCycle = 'monthly';

    const user = await User.create({
      fullName: fullName?.trim() || 'New User',
      email: normalizedEmail,
      password: passwordHash,
      role: assignedRole,
      subscription: defaultPlan,
      subscriptionBillingCycle: defaultBillingCycle,
      githubUsername: githubUsername?.trim() || '',
    });

    await Promise.all([
      Subscription.create({ ownerId: user._id, plan: defaultPlan, billingCycle: defaultBillingCycle }),
      PortfolioSettings.create({ ownerId: user._id }),
      OtpToken.deleteOne({ _id: otpDoc._id }),
    ]);

    const token = signToken(user._id);
    return res.status(201).json({
      message: 'registration successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(String(password), user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    return res.status(200).json({
      message: 'login successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = {
  requestRegistrationOtp,
  register,
  login,
};
