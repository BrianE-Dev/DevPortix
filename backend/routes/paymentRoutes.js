const express = require('express');
const validateUser = require('../middleware/validate_user');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');
const {
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
  handlePaystackWebhook,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/webhook', handlePaystackWebhook);
router.post('/initialize', validateUser, requireVerifiedUser, initializeSubscriptionPayment);
router.get('/verify/:reference', validateUser, requireVerifiedUser, verifySubscriptionPayment);

module.exports = router;
