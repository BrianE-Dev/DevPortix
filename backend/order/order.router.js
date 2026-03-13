const express = require('express');
const { createOrder, initializePayment, verifyPayment } = require('./order.controller');
const validateUser = require('../middleware/validate_user');

const orderRouter = express.Router();

orderRouter.post('/create-order', validateUser, createOrder);
orderRouter.post('/initialize-payment', validateUser, initializePayment);
orderRouter.get('/verify-payment/:reference', validateUser, verifyPayment);

module.exports = orderRouter
