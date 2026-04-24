const express = require('express');
const validateUser = require('../middleware/validate_user');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');
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
router.post('/submit/:track', validateUser, requireVerifiedUser, submitQuiz);
router.get('/score/:track', validateUser, getLatestScore);
router.get('/certificate/:track', validateUser, getCertificateData);

module.exports = router;
