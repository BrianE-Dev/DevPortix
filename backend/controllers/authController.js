const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const PortfolioSettings = require('../modules/portfolioSettings');
const {
  resendVerificationEmail,
  verifyEmailVerificationToken,
} = require('../services/emailVerification.service');
const {
  BCRYPT_SALT_ROUNDS,
  hasExternalOtpService,
  isValidEmail,
  normalizeEmail,
  requestRegistrationOtp: issueRegistrationOtp,
  verifyRegistrationOtp,
} = require('../services/otp.service');
const {
  decryptSecret,
  verifyToken,
} = require('../services/totp.service');

const TOKEN_TTL = '7d';
const PUBLIC_SIGNUP_ROLES = new Set(['student', 'instructor', 'organization', 'professional']);
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWTSECRET || 'devportix_dev_secret';

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });

const verifyTotpLoginChallenge = (token) => {
  const payload = jwt.verify(String(token || '').trim(), JWT_SECRET);
  if (payload?.type !== 'totp_login_challenge' || !payload?.sub) {
    throw new Error('Invalid TOTP login challenge');
  }

  return String(payload.sub);
};

const toPublicUser = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  emailVerified: true,
  role: userDoc.role,
  githubUsername: userDoc.githubUsername,
  avatar: userDoc.avatar,
  bio: userDoc.bio || '',
  subscription: userDoc.subscription,
  subscriptionBillingCycle: userDoc.subscriptionBillingCycle || 'monthly',
  skills: Array.isArray(userDoc.skills) ? userDoc.skills : [],
  dashboardMenu: userDoc.dashboardMenu || {},
  totpEnabled: false,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

const requestRegistrationOtp = async (req, res) => {
  const otpMode = hasExternalOtpService() ? 'external-email-service' : 'local-otp-store';
  res.set('X-OTP-Mode', otpMode);

  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      res.set('X-OTP-Source', 'backend-request-validation');
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const payload = await issueRegistrationOtp(email);
    res.set('X-OTP-Source', hasExternalOtpService() ? 'backend-forwarded-to-external-service' : 'backend-local-otp-issued');
    return res.status(200).json(payload);
  } catch (error) {
    if (error?.statusCode === 429 && error?.retryAfterSeconds) {
      res.set('Retry-After', String(error.retryAfterSeconds));
    }
    if (!res.getHeader('X-OTP-Source')) {
      if (error?.statusCode === 429) {
        res.set(
          'X-OTP-Source',
          hasExternalOtpService()
            ? 'external-service-or-forwarded-rate-limit'
            : 'backend-local-otp-cooldown',
        );
      } else if (hasExternalOtpService()) {
        res.set('X-OTP-Source', 'backend-forwarded-to-external-service');
      } else {
        res.set('X-OTP-Source', 'backend-local-otp-service');
      }
    }
    console.error('[auth] Failed to send registration OTP:', error.message);
    const statusCode = error?.statusCode || 503;
    const message = error?.statusCode && error.statusCode < 500
      ? error.message
      : 'OTP service is temporarily unavailable. Please try again shortly.';

    return res.status(statusCode).json({
      message,
      ...(error?.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
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

const verifyEmail = async (req, res) => {
  try {
    const payload = await verifyEmailVerificationToken(req.body?.token || req.query?.token);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      message: error?.message || 'Failed to verify email',
      ...(error?.email ? { email: error.email } : {}),
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const payload = await resendVerificationEmail(req.body?.email);
    return res.status(200).json(payload);
  } catch (error) {
    if (error?.statusCode === 429 && error?.retryAfterSeconds) {
      res.set('Retry-After', String(error.retryAfterSeconds));
    }

    return res.status(error?.statusCode || 500).json({
      message: error?.message || 'Failed to resend verification email',
      ...(error?.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
    });
  }
};

const register = async (req, res) => {
  try {
    const { fullName, email, password, role, githubUsername } = req.body || {};

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

    const passwordHash = await bcrypt.hash(String(password), BCRYPT_SALT_ROUNDS);

    const normalizedRole = String(role || 'student').trim().toLowerCase();
    const assignedRole = PUBLIC_SIGNUP_ROLES.has(normalizedRole) ? normalizedRole : 'student';
    const defaultPlan = 'free';
    const defaultBillingCycle = 'monthly';

    const user = await User.create({
      fullName: fullName?.trim() || 'New User',
      email: normalizedEmail,
      password: passwordHash,
      emailVerified: true,
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
      message: 'Registration successful',
      requiresEmailVerification: false,
      token,
      email: normalizedEmail,
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

const verifyLoginTotp = async (req, res) => {
  try {
    const { code, loginChallengeToken } = req.body || {};
    const userId = verifyTotpLoginChallenge(loginChallengeToken);
    const user = await User.findById(userId).select('+password');

    if (!user || !user.totpEnabled) {
      return res.status(401).json({ message: 'TOTP is not enabled for this account' });
    }

    const secret = decryptSecret(user.totpSecret);
    if (!secret || !verifyToken(secret, code)) {
      return res.status(401).json({ message: 'Invalid authentication code' });
    }

    const token = signToken(user._id);
    return res.status(200).json({
      message: 'login successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(401).json({ message: 'Failed to verify authentication code' });
  }
};

const getTotpStatus = async (req, res) => {
  return res.status(200).json({
    totpEnabled: false,
    hasPendingSetup: false,
    email: req.userData?.email || '',
  });
};

const createTotpSetup = async (req, res) => {
  return res.status(410).json({ message: 'TOTP setup is disabled' });
};

const enableTotp = async (req, res) => {
  return res.status(410).json({ message: 'TOTP setup is disabled' });
};

const disableTotp = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('totpEnabled totpSecret totpPendingSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.totpEnabled) {
      return res.status(400).json({ message: 'Authenticator app protection is not enabled' });
    }

    const secret = decryptSecret(user.totpSecret);
    if (!secret || !verifyToken(secret, req.body?.code)) {
      return res.status(400).json({ message: 'Invalid authentication code' });
    }

    user.totpEnabled = false;
    user.totpSecret = { cipherText: '', iv: '', authTag: '' };
    user.totpPendingSecret = { cipherText: '', iv: '', authTag: '' };
    await user.save();

    return res.status(200).json({
      message: 'Authenticator app protection disabled',
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to disable TOTP', error: error.message });
  }
};

module.exports = {
  requestRegistrationOtp,
  verifyOtp,
  verifyEmail,
  resendVerification,
  register,
  login,
  verifyLoginTotp,
  getTotpStatus,
  createTotpSetup,
  enableTotp,
  disableTotp,
};
