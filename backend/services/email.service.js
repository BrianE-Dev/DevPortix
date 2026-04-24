const nodemailer = require('nodemailer');

let cachedTransporter = null;

const parseSmtpPort = () => {
  const parsed = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
};

const isSecurePort = (port) => port === 465;

const getSmtpConfig = () => {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = parseSmtpPort();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const from = String(process.env.SMTP_FROM || user).trim();

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP configuration is incomplete');
  }

  return {
    host,
    port,
    secure: isSecurePort(port),
    auth: { user, pass },
    from,
  };
};

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getSmtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return cachedTransporter;
};

const buildVerificationEmail = ({ otp, expiresInMinutes }) => {
  const subject = 'DevPortix Verification Code';
  const text = `Your DevPortix verification code is: ${otp}. It expires in ${expiresInMinutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #101828;">
      <h2 style="margin-bottom: 16px;">DevPortix Verification Code</h2>
      <p style="font-size: 16px; line-height: 1.6;">Use the code below to continue your registration.</p>
      <div style="margin: 24px 0; padding: 16px 20px; border-radius: 12px; background: #f4f7fb; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center;">
        ${otp}
      </div>
      <p style="font-size: 14px; line-height: 1.6;">This code expires in ${expiresInMinutes} minutes. If you did not request it, you can ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
};

const buildVerificationLinkEmail = ({
  fullName,
  verificationLink,
  expiresInMinutes,
}) => {
  const safeName = String(fullName || 'there').trim() || 'there';
  const subject = 'Verify your DevPortix email';
  const text = `Hi ${safeName}, verify your DevPortix account by opening this link: ${verificationLink} . This link expires in ${expiresInMinutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #101828;">
      <h2 style="margin-bottom: 16px;">Verify your email</h2>
      <p style="font-size: 16px; line-height: 1.6;">Hi ${safeName}, thanks for creating your DevPortix account.</p>
      <p style="font-size: 16px; line-height: 1.6;">Click the button below to verify your email address and unlock sign in.</p>
      <div style="margin: 28px 0;">
        <a href="${verificationLink}" style="display: inline-block; padding: 14px 22px; border-radius: 12px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700;">
          Verify Email
        </a>
      </div>
      <p style="font-size: 14px; line-height: 1.6;">This link expires in ${expiresInMinutes} minutes. If the button does not work, copy and paste this URL into your browser:</p>
      <p style="font-size: 14px; line-height: 1.6; word-break: break-all;">
        <a href="${verificationLink}" style="color: #2563eb;">${verificationLink}</a>
      </p>
      <p style="font-size: 14px; line-height: 1.6;">If you did not create this account, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
};

const sendVerificationOtpEmail = async ({ to, otp, expiresInMinutes }) => {
  const transporter = getTransporter();
  const config = getSmtpConfig();
  const message = buildVerificationEmail({ otp, expiresInMinutes });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

const sendEmailVerificationLinkEmail = async ({
  to,
  fullName,
  verificationLink,
  expiresInMinutes,
}) => {
  const transporter = getTransporter();
  const config = getSmtpConfig();
  const message = buildVerificationLinkEmail({
    fullName,
    verificationLink,
    expiresInMinutes,
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};

module.exports = {
  sendEmailVerificationLinkEmail,
  sendVerificationOtpEmail,
};
