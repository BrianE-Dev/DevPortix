const express = require('express');
const { createOrder, initializePayment, verifyPayment } = require('./order.controller');
const validateUser = require('../middleware/validate_user');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');

const orderRouter = express.Router();

orderRouter.post('/create-order', validateUser, requireVerifiedUser, createOrder);
orderRouter.post('/initialize-payment', validateUser, requireVerifiedUser, initializePayment);
orderRouter.get('/verify-payment/:reference', validateUser, requireVerifiedUser, verifyPayment);

module.exports = orderRouter
