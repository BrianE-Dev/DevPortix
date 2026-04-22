const express = require('express');
const {
  requestRegistrationOtp,
  verifyOtp,
  register,
  login,
  verifyLoginTotp,
  getTotpStatus,
  createTotpSetup,
  enableTotp,
  disableTotp,
} = require('../controllers/authController');
const {
  registrationOtpRequestLimiter,
  registrationOtpVerifyLimiter,
} = require('../middleware/rateLimit.middleware');
const validateUser = require('../middleware/validate_user');

const router = express.Router();

router.post('/register/otp/request', registrationOtpRequestLimiter, requestRegistrationOtp);
router.post('/request-otp', registrationOtpRequestLimiter, requestRegistrationOtp);
router.post('/verify-otp', registrationOtpVerifyLimiter, verifyOtp);
router.post('/register/otp/verify', registrationOtpVerifyLimiter, verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/login/totp', verifyLoginTotp);
router.get('/totp/status', validateUser, getTotpStatus);
router.post('/totp/setup', validateUser, createTotpSetup);
router.post('/totp/enable', validateUser, enableTotp);
router.post('/totp/disable', validateUser, disableTotp);

module.exports = router;
