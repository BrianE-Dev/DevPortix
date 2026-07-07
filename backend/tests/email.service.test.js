const test = require("node:test");
const assert = require("node:assert/strict");

process.env.SMTP_HOST = "";
process.env.SMTP_PORT = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.SMTP_FROM = "";

const {
  sendVerificationOtpEmail,
  sendEmailVerificationLinkEmail,
} = require("../services/email.service");

test("mail helpers resolve without throwing when SMTP is not configured", async () => {
  await assert.doesNotReject(() =>
    sendVerificationOtpEmail({
      to: "user@example.com",
      otp: "123456",
      expiresInMinutes: 5,
    }),
  );

  await assert.doesNotReject(() =>
    sendEmailVerificationLinkEmail({
      to: "user@example.com",
      fullName: "Test User",
      verificationLink: "https://example.com/verify",
      expiresInMinutes: 30,
    }),
  );
});
