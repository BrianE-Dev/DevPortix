const express = require('express');
const validateUser = require('../middleware/validate_user');
const {
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/initialize', validateUser, initializeSubscriptionPayment);
router.get('/verify/:reference', validateUser, verifySubscriptionPayment);

module.exports = router;
