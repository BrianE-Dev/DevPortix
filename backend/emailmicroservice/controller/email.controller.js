const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('./user.schema');
const EmailOtp = require('./otp.schema');

const OTP_EXPIRY_MS = Number(process.env.OTP_EXPIRY_MS) || 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 3;
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_MS) || 45 * 1000;

const normalizeEmail = (value) =>
  String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
const isValidEmail = (value) => validator.isEmail(value);
const extractEmailFromBody = (body) => {
  if (!body || typeof body !== 'object') return '';
  if (typeof body.email === 'string') return body.email;
  if (body.email && typeof body.email === 'object' && typeof body.email.value === 'string') {
    return body.email.value;
  }
  if (typeof body.userEmail === 'string') return body.userEmail;
  return '';
};

const smtpUser = String(process.env.EMAIL || process.env.MAIL_USER || '').trim();
const smtpPass = String(process.env.EMAILSECRET || process.env.MAIL_PASS || '').trim();
const jwtSecret = String(process.env.JWT_SECRET || process.env.JWTSECRET || 'devportix_dev_secret').trim();

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

if (!transporter) {
  console.warn('[email-service] SMTP not configured. Set EMAIL/EMAILSECRET (or MAIL_USER/MAIL_PASS).');
}

const ensureDbReady = () => mongoose.connection.readyState === 1;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
  if (!transporter) {
    throw new Error('Email transporter is not configured');
  }

  const mailOptions = {
    from: smtpUser,
    to: email,
    subject: 'Your One Time Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your OTP code is:</h2>
        <div style="background-color:#13b4ff; padding:20px; text-align:center; border-radius:8px;">
          <h1 style="color:#ffffff; font-size:36px; margin:0;">${otp}</h1>
        </div>
        <p style="margin-top:16px;">This code expires in 10 minutes.</p>
      </div>
    `,
    text: `Your OTP code is: ${otp}. This code expires in 10 minutes.`,
  };

  return transporter.sendMail(mailOptions);
}

async function sendOTP(req, res) {
  try {
    if (!ensureDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'OTP service is temporarily unavailable. Database is not connected.',
      });
    }

    const email = normalizeEmail(extractEmailFromBody(req.body));
    const purpose = String(req.body?.purpose || 'registration').trim().toLowerCase();

    if (purpose !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Only registration OTP is supported.',
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required.',
      });
    }

    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const latestOtp = await EmailOtp.findOne({
      email,
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (latestOtp) {
      const elapsed = Date.now() - new Date(latestOtp.createdAt).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfterSec}s before requesting another OTP.`,
        });
      }
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MS);

    await EmailOtp.create({
      email,
      purpose,
      otpHash,
      expiresAt: expiryTime,
      attempts: 0,
      consumedAt: null,
    });

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}.`,
      expiresAt: expiryTime.toISOString(),
    });
  } catch (error) {
    console.error('[email-service] Send OTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Check SMTP configuration.',
    });
  }
}

async function verifyOTP(req, res) {
  try {
    if (!ensureDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'OTP service is temporarily unavailable. Database is not connected.',
      });
    }

    const email = normalizeEmail(extractEmailFromBody(req.body));
    const otp = String(req.body?.otp || '').trim();
    const purpose = String(req.body?.purpose || 'registration').trim().toLowerCase();

    if (purpose !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Only registration OTP is supported.',
      });
    }

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const otpRecord = await EmailOtp.findOne({
      email,
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired.',
      });
    }

    if (Date.now() > new Date(otpRecord.expiresAt).getTime()) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired.',
      });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        await EmailOtp.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({
          success: false,
          message: 'Too many attempts. Please request a new OTP.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    const registrationToken = jwt.sign(
      {
        email,
        emailVerified: true,
        purpose: 'registration',
      },
      jwtSecret,
      { expiresIn: '30m' }
    );

    return res.status(200).json({
      success: true,
      message: 'Registration email verification successful.',
      data: { registrationToken },
    });
  } catch (error) {
    console.error('[email-service] Verify OTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP.',
    });
  }
}

module.exports = { sendOTP, verifyOTP };
