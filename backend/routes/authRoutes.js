const express = require('express');
const { requestRegistrationOtp, register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register/otp/request', requestRegistrationOtp);
router.post('/register', register);
router.post('/login', login);

module.exports = router;
