const crypto = require('crypto');
const EmailVerificationToken = require('../modules/emailVerificationToken');
const User = require('../modules/userSchema');
const { normalizeEmail, isValidEmail } = require('./otp.service');
const { sendEmailVerificationLinkEmail } = require('./email.service');

const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TTL_MINUTES = Math.max(
  5,
  Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES || 60),
);
const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = Math.max(
  15,
  Number(process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || 60),
);
const DEFAULT_PUBLIC_APP_URL = 'http://localhost:5173';

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token || '')).digest('hex');

const generateVerificationToken = () =>
  crypto.randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString('hex');

const getExpiryDate = () =>
  new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

const getPublicAppUrl = () =>
  String(
    process.env.PUBLIC_APP_URL ||
      process.env.CLIENT_URL ||
      process.env.CORS_ORIGIN ||
      DEFAULT_PUBLIC_APP_URL,
  )
    .trim()
    .replace(/\/+$/, '');

const buildVerificationLink = (token) =>
  `${getPublicAppUrl()}/verify-email?token=${encodeURIComponent(String(token || ''))}`;

const invalidateActiveVerificationTokens = async (userId) => {
  await EmailVerificationToken.updateMany(
    {
      userId,
      consumedAt: null,
      invalidatedAt: null,
    },
    {
      $set: { invalidatedAt: new Date() },
    },
  );
};

const getRetryAfterSeconds = async (userId) => {
  const latestToken = await EmailVerificationToken.findOne({ userId })
    .sort({ createdAt: -1 })
    .select('createdAt');

  if (!latestToken?.createdAt) {
    return 0;
  }

  const msRemaining =
    latestToken.createdAt.getTime() +
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000 -
    Date.now();

  return msRemaining > 0 ? Math.ceil(msRemaining / 1000) : 0;
};

const issueVerificationEmailForUser = async (user, options = {}) => {
  if (!user?._id || !user?.email) {
    throw new Error('A valid user is required to issue a verification email');
  }

  if (user.emailVerified) {
    const error = new Error('This email address has already been verified');
    error.statusCode = 409;
    throw error;
  }

  const retryAfterSeconds = options.skipCooldown
    ? 0
    : await getRetryAfterSeconds(user._id);

  if (retryAfterSeconds > 0) {
    const error = new Error(
      'A verification email was sent recently. Please wait before requesting another link.',
    );
    error.statusCode = 429;
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  await invalidateActiveVerificationTokens(user._id);

  const rawToken = generateVerificationToken();
  const verificationLink = buildVerificationLink(rawToken);
  const verificationToken = await EmailVerificationToken.create({
    userId: user._id,
    email: normalizeEmail(user.email),
    tokenHash: hashToken(rawToken),
    expiresAt: getExpiryDate(),
  });

  try {
    await sendEmailVerificationLinkEmail({
      to: normalizeEmail(user.email),
      fullName: user.fullName,
      verificationLink,
      expiresInMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
    });
  } catch (error) {
    await EmailVerificationToken.deleteOne({ _id: verificationToken._id });
    error.statusCode = 503;
    throw error;
  }

  return {
    message: 'Verification email sent successfully',
    email: normalizeEmail(user.email),
    expiresAt: verificationToken.expiresAt,
    cooldownEndsAt: new Date(
      Date.now() + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000,
    ),
  };
};

const resendVerificationEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    const error = new Error('A valid email address is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    '_id email fullName emailVerified',
  );

  if (!user) {
    const error = new Error('No account was found for that email address');
    error.statusCode = 404;
    throw error;
  }

  return issueVerificationEmailForUser(user);
};

const verifyEmailVerificationToken = async (token) => {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) {
    const error = new Error('Verification token is required');
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = hashToken(normalizedToken);
  const verificationToken = await EmailVerificationToken.findOne({
    tokenHash,
  });

  if (!verificationToken) {
    const error = new Error('This verification link is invalid');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(verificationToken.email);

  if (verificationToken.consumedAt) {
    const error = new Error('This verification link has already been used');
    error.statusCode = 409;
    error.email = normalizedEmail;
    throw error;
  }

  if (verificationToken.invalidatedAt) {
    const error = new Error('This verification link has been replaced by a newer one');
    error.statusCode = 409;
    error.email = normalizedEmail;
    throw error;
  }

  if (verificationToken.expiresAt.getTime() <= Date.now()) {
    const error = new Error('This verification link has expired');
    error.statusCode = 410;
    error.email = normalizedEmail;
    throw error;
  }

  const user = await User.findById(verificationToken.userId).select(
    '_id email fullName emailVerified',
  );

  if (!user) {
    const error = new Error('This verification link is no longer valid');
    error.statusCode = 404;
    error.email = normalizedEmail;
    throw error;
  }

  if (!user.emailVerified) {
    user.emailVerified = true;
    await user.save();
  }

  verificationToken.consumedAt = new Date();
  await verificationToken.save();

  await EmailVerificationToken.updateMany(
    {
      userId: user._id,
      _id: { $ne: verificationToken._id },
      consumedAt: null,
      invalidatedAt: null,
    },
    {
      $set: { invalidatedAt: new Date() },
    },
  );

  return {
    message: 'Email verified successfully',
    email: normalizeEmail(user.email),
  };
};

module.exports = {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  EMAIL_VERIFICATION_TTL_MINUTES,
  issueVerificationEmailForUser,
  resendVerificationEmail,
  verifyEmailVerificationToken,
};
