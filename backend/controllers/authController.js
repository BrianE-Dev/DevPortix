const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const PortfolioSettings = require('../modules/portfolioSettings');
const {
  BCRYPT_SALT_ROUNDS,
  hasExternalOtpService,
  isValidEmail,
  normalizeEmail,
  requestRegistrationOtp: issueRegistrationOtp,
  verifyRegistrationOtp,
  verifyRegistrationVerificationToken,
} = require('../services/otp.service');
const {
  buildSetupPayload,
  decryptSecret,
  encryptSecret,
  generateSecret,
  verifyToken,
} = require('../services/totp.service');

const TOKEN_TTL = '7d';
const LOGIN_TOTP_TOKEN_TTL = '5m';
const PUBLIC_SIGNUP_ROLES = new Set(['student', 'instructor', 'organization', 'professional']);
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWTSECRET || 'devportix_dev_secret';

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });

const signTotpLoginChallenge = (userId) =>
  jwt.sign(
    {
      sub: String(userId),
      type: 'totp_login_challenge',
    },
    JWT_SECRET,
    { expiresIn: LOGIN_TOTP_TOKEN_TTL },
  );

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
  emailVerified: Boolean(userDoc.emailVerified),
  role: userDoc.role,
  githubUsername: userDoc.githubUsername,
  avatar: userDoc.avatar,
  bio: userDoc.bio || '',
  subscription: userDoc.subscription,
  subscriptionBillingCycle: userDoc.subscriptionBillingCycle || 'monthly',
  skills: Array.isArray(userDoc.skills) ? userDoc.skills : [],
  dashboardMenu: userDoc.dashboardMenu || {},
  totpEnabled: Boolean(userDoc.totpEnabled),
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

    if (user.totpEnabled) {
      return res.status(200).json({
        message: 'TOTP verification required',
        requiresTotp: true,
        loginChallengeToken: signTotpLoginChallenge(user._id),
      });
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
  try {
    const user = await User.findById(req.userId).select('email totpEnabled totpPendingSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      totpEnabled: Boolean(user.totpEnabled),
      hasPendingSetup: Boolean(user.totpPendingSecret?.cipherText),
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load TOTP status', error: error.message });
  }
};

const createTotpSetup = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email totpEnabled totpPendingSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret = generateSecret();
    user.totpPendingSecret = encryptSecret(secret);
    await user.save();

    return res.status(200).json({
      message: user.totpEnabled ? 'New TOTP setup generated' : 'TOTP setup generated',
      totpEnabled: Boolean(user.totpEnabled),
      ...await buildSetupPayload({ email: user.email, secret }),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create TOTP setup', error: error.message });
  }
};

const enableTotp = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email totpEnabled totpSecret totpPendingSecret');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pendingSecret = decryptSecret(user.totpPendingSecret);
    if (!pendingSecret) {
      return res.status(400).json({ message: 'Start TOTP setup before verifying a code' });
    }

    if (!verifyToken(pendingSecret, req.body?.code)) {
      return res.status(400).json({ message: 'Invalid authentication code' });
    }

    user.totpSecret = user.totpPendingSecret;
    user.totpPendingSecret = { cipherText: '', iv: '', authTag: '' };
    user.totpEnabled = true;
    await user.save();

    return res.status(200).json({
      message: 'Authenticator app protection enabled',
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to enable TOTP', error: error.message });
  }
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
  register,
  login,
  verifyLoginTotp,
  getTotpStatus,
  createTotpSetup,
  enableTotp,
  disableTotp,
};
