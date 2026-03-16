const express = require('express');
const { sendOTP, verifyOTP } = require('./email.controller');

const emailRouter = express.Router();

emailRouter.post('/send-otp', sendOTP);
emailRouter.post('/verify-otp', verifyOTP);

// Backward-compatible aliases
emailRouter.post('/send-OTP', sendOTP);
emailRouter.post('/verify-OTP', verifyOTP);

module.exports = { emailRouter };
