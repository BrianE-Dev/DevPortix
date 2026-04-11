const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const PortfolioSettings = require('../modules/portfolioSettings');
const {
  BCRYPT_SALT_ROUNDS,
  isValidEmail,
  normalizeEmail,
  requestRegistrationOtp: issueRegistrationOtp,
  verifyRegistrationOtp,
  verifyRegistrationVerificationToken,
} = require('../services/otp.service');

const TOKEN_TTL = '7d';
const PUBLIC_SIGNUP_ROLES = new Set(['student', 'instructor', 'organization', 'professional']);

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET || 'devportix_dev_secret', {
    expiresIn: TOKEN_TTL,
  });

const toPublicUser = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  emailVerified: Boolean(userDoc.emailVerified),
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
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const payload = await issueRegistrationOtp(email);
    return res.status(200).json(payload);
  } catch (error) {
    if (error?.statusCode === 429 && error?.retryAfterSeconds) {
      res.set('Retry-After', String(error.retryAfterSeconds));
    }
    console.error('[auth] Failed to send registration OTP:', error.message);
    return res.status(error?.statusCode || 503).json({
      message: error?.statusCode && error.statusCode < 500
        ? error.message
        : 'OTP service is temporarily unavailable. Please try again shortly.',
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const payload = await verifyRegistrationOtp(email, otp);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[auth] Failed to verify registration OTP:', error.message);
    return res.status(error?.statusCode || 500).json({
      message: error?.statusCode && error.statusCode < 500 ? error.message : 'Failed to verify OTP',
    });
  }
};

const register = async (req, res) => {
  try {
    const { fullName, email, password, role, githubUsername, otp, verificationToken } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    let emailVerified = false;
    if (verificationToken) {
      try {
        emailVerified = verifyRegistrationVerificationToken(verificationToken, normalizedEmail);
      } catch (_error) {
        emailVerified = false;
      }
    }

    if (!emailVerified) {
      if (!otp) {
        return res.status(400).json({
          message: 'Provide a valid OTP or verification token before creating your account',
        });
      }

      try {
        await verifyRegistrationOtp(normalizedEmail, otp);
        emailVerified = true;
      } catch (error) {
        return res.status(error?.statusCode || 400).json({ message: error.message || 'Invalid registration OTP' });
      }
    }

    const passwordHash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);

    const normalizedRole = String(role || 'student').trim().toLowerCase();
    const assignedRole = PUBLIC_SIGNUP_ROLES.has(normalizedRole) ? normalizedRole : 'student';
    const defaultPlan = 'free';
    const defaultBillingCycle = 'monthly';

    const user = await User.create({
      fullName: fullName?.trim() || 'New User',
      email: normalizedEmail,
      password: passwordHash,
      emailVerified,
      role: assignedRole,
      subscription: defaultPlan,
      subscriptionBillingCycle: defaultBillingCycle,
      githubUsername: githubUsername?.trim() || '',
    });

    await Promise.all([
      Subscription.create({ ownerId: user._id, plan: defaultPlan, billingCycle: defaultBillingCycle }),
      PortfolioSettings.create({ ownerId: user._id }),
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
  verifyOtp,
  register,
  login,
};
