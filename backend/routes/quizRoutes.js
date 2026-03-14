const express = require('express');
const validateUser = require('../middleware/validate_user');
const { requirePaidPlan } = require('../middleware/requirePaidPlan');
const {
  listQuizTracks,
  getQuizQuestions,
  submitQuiz,
  getLatestScore,
  getCertificateData,
} = require('../controllers/quizController');

const router = express.Router();

router.get('/tracks', validateUser, listQuizTracks);
router.get('/questions/:track', validateUser, getQuizQuestions);
router.post('/submit/:track', validateUser, submitQuiz);
router.get('/score/:track', validateUser, requirePaidPlan(), getLatestScore);
router.get('/certificate/:track', validateUser, requirePaidPlan(), getCertificateData);

module.exports = router;
