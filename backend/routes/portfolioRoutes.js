const express = require('express');
const validateUser = require('../middleware/validate_user');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');
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
router.post('/me', validateUser, requireVerifiedUser, requirePaidPlan(), createMyPortfolio);
router.patch('/me', validateUser, requireVerifiedUser, requirePaidPlan(), updateMyPortfolio);
router.delete('/me', validateUser, requireVerifiedUser, deleteMyPortfolio);
router.get('/me/share', validateUser, requireVerifiedUser, requirePaidPlan(), generatePortfolioShareAssets);
router.get('/public/:slug/score', getPublicPortfolioScore);
router.get('/public/:slug', getPublicPortfolio);

module.exports = router;
