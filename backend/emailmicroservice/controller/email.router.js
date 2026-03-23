const express = require('express');
const { requestOtp, verifyOtp } = require('./email.controller');

const emailRouter = express.Router();

emailRouter.post('/otp/request', requestOtp);
emailRouter.post('/otp/verify', verifyOtp);

module.exports = { emailRouter };
