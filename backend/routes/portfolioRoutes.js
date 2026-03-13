const express = require('express');
const validateUser = require('../middleware/validate_user');
const {
  getMyPortfolio,
  createMyPortfolio,
  updateMyPortfolio,
  getPublicPortfolio,
} = require('../controllers/portfolioController');
const { generatePortfolioShareAssets } = require('../tracking/tracking.controller');

const router = express.Router();

router.get('/me', validateUser, getMyPortfolio);
router.post('/me', validateUser, createMyPortfolio);
router.patch('/me', validateUser, updateMyPortfolio);
router.get('/me/share', validateUser, generatePortfolioShareAssets);
router.get('/public/:slug', getPublicPortfolio);

module.exports = router;
