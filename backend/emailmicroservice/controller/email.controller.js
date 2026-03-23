const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Joi = require('joi');
const OtpToken = require('./otp.schema');

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const EMAIL_FROM_NAME = String(process.env.EMAIL_FROM_NAME || 'DevPortix').trim();
const MAIL_PROVIDER = String(process.env.MAIL_PROVIDER || '').trim().toLowerCase();

const requestOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  purpose: Joi.string().trim().max(60).default('email_verification'),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: Joi.string().trim().pattern(/^\d{6}$/).required(),
  purpose: Joi.string().trim().max(60).default('email_verification'),
});

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizePurpose = (value) => String(value || 'email_verification').trim().toLowerCase();

const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (email, purpose, otp) =>
  crypto.createHash('sha256').update(`${normalizeEmail(email)}:${normalizePurpose(purpose)}:${String(otp)}`).digest('hex');

const createTransporter = () => {
  const host = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true';
  const user = String(process.env.MAIL_USER || process.env.EMAIL || '').trim();
  const pass = String(process.env.MAIL_PASS || process.env.EMAILSECRET || '').trim();

  if (!user || !pass) {
    throw new Error('Email credentials are not configured');
  }

  if (MAIL_PROVIDER === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    auth: { user, pass },
  });
};

const buildOtpEmail = ({ otp, purpose }) => {
  const subjectPurpose = normalizePurpose(purpose).replace(/_/g, ' ');

  return {
    subject: `Your DevPortix OTP for ${subjectPurpose}`,
    text: `Your DevPortix OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">DevPortix Verification Code</h2>
        <p>Use the code below to continue your ${subjectPurpose} flow.</p>
        <div style="display: inline-block; margin: 12px 0; padding: 12px 18px; border-radius: 12px; background: #eff6ff; font-size: 28px; font-weight: 700; letter-spacing: 6px;">
          ${otp}
        </div>
        <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  };
};

const requestOtp = async (req, res) => {
  try {
    const { value, error } = requestOtpSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0]?.message || 'Invalid request payload' });
    }

    const email = normalizeEmail(value.email);
    const purpose = normalizePurpose(value.purpose);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    const codeHash = hashOtp(email, purpose, otp);

    await OtpToken.findOneAndUpdate(
      { email, purpose },
      {
        $set: {
          email,
          purpose,
          codeHash,
          expiresAt,
          attempts: 0,
          verifiedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const transporter = createTransporter();
    const mailUser = String(process.env.MAIL_USER || process.env.EMAIL || '').trim();
    const fromEmail = String(process.env.SMTP_FROM_EMAIL || mailUser).trim();
    const emailPayload = buildOtpEmail({ otp, purpose });

    await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${fromEmail}>`,
      to: email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });

    return res.status(200).json({
      message: 'OTP sent successfully',
      email,
      purpose,
      expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { value, error } = verifyOtpSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0]?.message || 'Invalid request payload' });
    }

    const email = normalizeEmail(value.email);
    const purpose = normalizePurpose(value.purpose);
    const otpDoc = await OtpToken.findOne({ email, purpose });

    if (!otpDoc) {
      return res.status(404).json({ message: 'OTP not found or expired' });
    }

    if (otpDoc.verifiedAt) {
      return res.status(409).json({ message: 'OTP has already been used' });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      return res.status(410).json({ message: 'OTP has expired' });
    }

    if (Number(otpDoc.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({ message: 'Maximum OTP attempts exceeded' });
    }

    const submittedHash = hashOtp(email, purpose, value.otp);
    if (submittedHash !== otpDoc.codeHash) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpDoc.verifiedAt = new Date();
    otpDoc.attempts = Number(otpDoc.attempts || 0) + 1;
    await otpDoc.save();

    return res.status(200).json({
      message: 'OTP verified successfully',
      email,
      purpose,
      verifiedAt: otpDoc.verifiedAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
