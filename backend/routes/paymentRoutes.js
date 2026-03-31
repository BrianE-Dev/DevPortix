const express = require('express');
const validateUser = require('../middleware/validate_user');
const {
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
  handlePaystackWebhook,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/webhook', handlePaystackWebhook);
router.post('/initialize', validateUser, initializeSubscriptionPayment);
router.get('/verify/:reference', validateUser, verifySubscriptionPayment);

module.exports = router;
