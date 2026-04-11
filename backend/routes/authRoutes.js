const express = require('express');
const { requestRegistrationOtp, verifyOtp, register, login } = require('../controllers/authController');
const {
  registrationOtpRequestLimiter,
  registrationOtpVerifyLimiter,
} = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/register/otp/request', registrationOtpRequestLimiter, requestRegistrationOtp);
router.post('/request-otp', registrationOtpRequestLimiter, requestRegistrationOtp);
router.post('/verify-otp', registrationOtpVerifyLimiter, verifyOtp);
router.post('/register/otp/verify', registrationOtpVerifyLimiter, verifyOtp);
router.post('/register', register);
router.post('/login', login);

module.exports = router;
