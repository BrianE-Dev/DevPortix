const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const OtpToken = require('../modules/otpToken');
const User = require('../modules/userSchema');
const { sendVerificationOtpEmail } = require('./email.service');

const OTP_PURPOSE_REGISTRATION = 'registration';
const OTP_EXPIRY_MINUTES = Math.max(1, Number(process.env.OTP_EXPIRY_MINUTES || 5));
const OTP_REQUEST_COOLDOWN_SECONDS = Math.max(1, Number(process.env.OTP_REQUEST_COOLDOWN_SECONDS || 60));
const OTP_MAX_ATTEMPTS = Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS || 5));
const OTP_BLOCK_MINUTES = Math.max(1, Number(process.env.OTP_BLOCK_MINUTES || 15));
const BCRYPT_SALT_ROUNDS = Math.max(8, Number(process.env.BCRYPT_SALT_ROUNDS || 12));
const REGISTRATION_VERIFICATION_TOKEN_TTL = String(
  process.env.REGISTRATION_VERIFICATION_TOKEN_TTL || '10m'
).trim();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
const generateNumericOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
const getExpiryDate = () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
const getCooldownDate = () => new Date(Date.now() + OTP_REQUEST_COOLDOWN_SECONDS * 1000);
const getBlockedUntilDate = () => new Date(Date.now() + OTP_BLOCK_MINUTES * 60 * 1000);

const signRegistrationVerificationToken = (email) =>
  jwt.sign(
    {
      sub: normalizeEmail(email),
      type: 'registration_verification',
    },
    process.env.JWT_SECRET || process.env.JWTSECRET || 'devportix_dev_secret',
    { expiresIn: REGISTRATION_VERIFICATION_TOKEN_TTL }
  );

const verifyRegistrationVerificationToken = (token, email) => {
  const payload = jwt.verify(
    String(token || '').trim(),
    process.env.JWT_SECRET || process.env.JWTSECRET || 'devportix_dev_secret'
  );

  return payload?.type === 'registration_verification' && payload?.sub === normalizeEmail(email);
};

const getActiveRegistrationOtp = async (email) =>
  OtpToken.findOne({ email: normalizeEmail(email), purpose: OTP_PURPOSE_REGISTRATION });

const requestRegistrationOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    const error = new Error('A valid email address is required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const existingOtp = await getActiveRegistrationOtp(normalizedEmail);
  if (existingOtp?.lastSentAt) {
    const msRemaining = existingOtp.lastSentAt.getTime() + OTP_REQUEST_COOLDOWN_SECONDS * 1000 - Date.now();
    if (msRemaining > 0) {
      const error = new Error('Too many OTP requests. Please wait before requesting another code.');
      error.statusCode = 429;
      error.retryAfterSeconds = Math.ceil(msRemaining / 1000);
      throw error;
    }
  }

  const otp = generateNumericOtp();
  // Store only a bcrypt hash so leaked database contents cannot be used to replay OTPs.
  const otpHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
  const now = new Date();

  const otpDoc = await OtpToken.findOneAndUpdate(
    { email: normalizedEmail, purpose: OTP_PURPOSE_REGISTRATION },
    {
      $set: {
        email: normalizedEmail,
        purpose: OTP_PURPOSE_REGISTRATION,
        otpHash,
        expiresAt: getExpiryDate(),
        attempts: 0,
        blockedUntil: null,
        lastSentAt: now,
        verifiedAt: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  try {
    await sendVerificationOtpEmail({
      to: normalizedEmail,
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    await OtpToken.deleteOne({ _id: otpDoc._id });
    error.statusCode = 503;
    throw error;
  }

  console.log(`[otp] registration code issued for ${normalizedEmail}`);

  return {
    message: 'Verification code sent successfully',
    email: normalizedEmail,
    expiresAt: otpDoc.expiresAt,
    cooldownEndsAt: getCooldownDate(),
  };
};

const verifyRegistrationOtp = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp || '').trim();

  if (!isValidEmail(normalizedEmail)) {
    const error = new Error('A valid email address is required');
    error.statusCode = 400;
    throw error;
  }

  if (!/^\d{6}$/.test(normalizedOtp)) {
    const error = new Error('OTP must be a 6-digit code');
    error.statusCode = 400;
    throw error;
  }

  const otpDoc = await getActiveRegistrationOtp(normalizedEmail);
  if (!otpDoc) {
    const error = new Error('Request a registration OTP before verifying your email');
    error.statusCode = 400;
    throw error;
  }

  if (otpDoc.expiresAt.getTime() <= Date.now()) {
    await OtpToken.deleteOne({ _id: otpDoc._id });
    const error = new Error('Your registration OTP has expired. Request a new code.');
    error.statusCode = 410;
    throw error;
  }

  if (otpDoc.blockedUntil && otpDoc.blockedUntil.getTime() > Date.now()) {
    const error = new Error('Too many invalid attempts. Please request a new code later.');
    error.statusCode = 429;
    throw error;
  }

  if (Number(otpDoc.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    otpDoc.blockedUntil = getBlockedUntilDate();
    await otpDoc.save();
    const error = new Error('Too many invalid attempts. Please request a new code later.');
    error.statusCode = 429;
    throw error;
  }

  const isMatch = await bcrypt.compare(normalizedOtp, otpDoc.otpHash);
  if (!isMatch) {
    otpDoc.attempts = Number(otpDoc.attempts || 0) + 1;
    if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
      otpDoc.blockedUntil = getBlockedUntilDate();
    }
    await otpDoc.save();

    const error = new Error(
      otpDoc.attempts >= OTP_MAX_ATTEMPTS
        ? 'Too many invalid attempts. Please request a new code later.'
        : 'Invalid registration OTP'
    );
    error.statusCode = otpDoc.attempts >= OTP_MAX_ATTEMPTS ? 429 : 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && !existingUser.emailVerified) {
    existingUser.emailVerified = true;
    await existingUser.save();
  }

  await OtpToken.deleteOne({ _id: otpDoc._id });

  return {
    message: 'OTP verified successfully',
    email: normalizedEmail,
    // A short-lived signed token lets the client finish registration without retaining a reusable OTP.
    verificationToken: signRegistrationVerificationToken(normalizedEmail),
  };
};

module.exports = {
  BCRYPT_SALT_ROUNDS,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_PURPOSE_REGISTRATION,
  OTP_REQUEST_COOLDOWN_SECONDS,
  normalizeEmail,
  isValidEmail,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  verifyRegistrationVerificationToken,
};
