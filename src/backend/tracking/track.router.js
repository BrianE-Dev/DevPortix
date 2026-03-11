const express = require('express');
const validateUser = require('../middleware/validate_user');
const { generatePortfolioShareAssets } = require('./tracking.controller');

const trackRouter = express.Router();

trackRouter.get('/portfolio/share', validateUser, generatePortfolioShareAssets);

module.exports = { trackRouter };
