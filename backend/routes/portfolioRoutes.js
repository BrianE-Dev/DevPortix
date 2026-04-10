const express = require('express');
const validateUser = require('../middleware/validate_user');
const { requirePaidPlan } = require('../middleware/requirePaidPlan');
const {
  getMyPortfolio,
  createMyPortfolio,
  updateMyPortfolio,
  deleteMyPortfolio,
  getPublicPortfolio,
  getMyPortfolioScore,
  getPublicPortfolioScore,
} = require('../controllers/portfolioController');
const { generatePortfolioShareAssets } = require('../tracking/tracking.controller');

const router = express.Router();

router.get('/me', validateUser, requirePaidPlan(), getMyPortfolio);
router.get('/me/score', validateUser, requirePaidPlan(), getMyPortfolioScore);
router.post('/me', validateUser, requirePaidPlan(), createMyPortfolio);
router.patch('/me', validateUser, requirePaidPlan(), updateMyPortfolio);
router.delete('/me', validateUser, deleteMyPortfolio);
router.get('/me/share', validateUser, requirePaidPlan(), generatePortfolioShareAssets);
router.get('/public/:slug/score', getPublicPortfolioScore);
router.get('/public/:slug', getPublicPortfolio);

module.exports = router;
