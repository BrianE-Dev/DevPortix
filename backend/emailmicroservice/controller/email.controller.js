const crypto = require('crypto');
const Joi = require('joi');
const OtpToken = require('./otp.schema');

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const MAX_VERIFY_ATTEMPTS = Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS || 6));
const EMAIL_FROM_NAME = String(process.env.EMAIL_FROM_NAME || 'DevPortix').trim();
const KEPLERS_API_KEY = String(process.env.KEPLERS_API_KEY || '').trim();
const KEPLERS_API_URL = String(
  process.env.KEPLERS_API_URL || 'https://api.keplars.com/api/v1/send-email/instant'
).trim();

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

const sendWithKeplers = async ({ to, subject, text, html }) => {
  if (!KEPLERS_API_KEY) {
    throw new Error('Keplars API key is not configured');
  }

  const response = await fetch(KEPLERS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEPLERS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [to],
      subject,
      body: html || text,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.message || 'Keplars email request failed');
  }

  return payload;
};

const sendEmail = async (payload) => {
  return sendWithKeplers(payload);
};

const buildOtpEmail = ({ otp, purpose }) => {
  const subjectPurpose = normalizePurpose(purpose).replace(/_/g, ' ');
  const titlePurpose = subjectPurpose
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    subject: `Your DevPortix OTP for ${titlePurpose}`,
    text: [
      'DevPortix Verification Code',
      '',
      `Your one-time password for ${subjectPurpose} is: ${otp}`,
      `This code expires in ${OTP_TTL_MINUTES} minutes.`,
      '',
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <div style="margin: 0; padding: 32px 16px; background: #eef4ff; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 640px; margin: 0 auto; overflow: hidden; border-radius: 28px; background: #ffffff; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);">
          <div style="padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%); color: #ffffff;">
            <div style="display: inline-block; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,0.14); font-size: 12px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase;">
              DevPortix Security
            </div>
            <h1 style="margin: 18px 0 10px; font-size: 30px; line-height: 1.2;">Verification Code</h1>
            <p style="margin: 0; max-width: 460px; font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.88);">
              Use this one-time password to complete your ${subjectPurpose} request and keep your DevPortix account secure.
            </p>
          </div>

          <div style="padding: 32px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">Request Type</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a;">${titlePurpose}</p>

            <div style="margin: 28px 0; border-radius: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 28px; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #2563eb;">
                One-Time Password
              </p>
              <div style="font-size: 34px; line-height: 1; font-weight: 800; letter-spacing: 10px; color: #0f172a;">
                ${otp}
              </div>
            </div>

            <div style="border-radius: 20px; background: #f8fafc; padding: 20px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #0f172a;">
                This code expires in <strong>${OTP_TTL_MINUTES} minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #475569;">
                If you did not request this code, you can ignore this email. For your protection, never share this OTP with anyone.
              </p>
            </div>

            <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.7; color: #64748b;">
              This message was sent by DevPortix to help verify your identity and complete a secure action on your account.
            </p>
          </div>
        </div>
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

    const emailPayload = buildOtpEmail({ otp, purpose });

    await sendEmail({
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
