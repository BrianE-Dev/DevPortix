const QuizAttempt = require('../modules/quizAttempt');
const User = require('../modules/userSchema');
const {
  QUIZ_TRACKS,
  TRACK_KEYS,
  resolveTrackKey,
  getTrackQuestions,
} = require('../data/quizQuestionBank');

const PASS_PERCENTAGE = 60;
const CERTIFICATE_FORMATS = ['png', 'pdf'];

const normalizePlan = (value) => {
  const normalized = String(value || 'free').trim().toLowerCase();
  return normalized === 'pro' ? 'premium' : normalized;
};

const toTrackPayload = (track) => ({
  id: track,
  label: QUIZ_TRACKS[track].label,
  questionCount: QUIZ_TRACKS[track].questions.length,
});

const toQuestionPayload = (question) => ({
  id: question.id,
  prompt: question.prompt,
  options: question.options,
});

const normalizeAnswersMap = (answers) => {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {};
  return Object.entries(answers).reduce((acc, [questionId, value]) => {
    const normalizedId = String(questionId || '').trim();
    const selectedIndex = Number(value);
    if (!normalizedId || !Number.isInteger(selectedIndex) || selectedIndex < 0) return acc;
    acc[normalizedId] = selectedIndex;
    return acc;
  }, {});
};

const listQuizTracks = async (_req, res) => {
  return res.status(200).json({
    passPercentage: PASS_PERCENTAGE,
    tracks: TRACK_KEYS.map(toTrackPayload),
  });
};

const getQuizQuestions = async (req, res) => {
  const trackKey = resolveTrackKey(req.params.track);
  if (!trackKey) {
    return res.status(400).json({ message: 'Invalid track. Use html, css, javascript, or react.' });
  }

  const questions = getTrackQuestions(trackKey) || [];
  return res.status(200).json({
    track: toTrackPayload(trackKey),
    passPercentage: PASS_PERCENTAGE,
    questions: questions.map(toQuestionPayload),
  });
};

const submitQuiz = async (req, res) => {
  try {
    const trackKey = resolveTrackKey(req.params.track);
    if (!trackKey) {
      return res.status(400).json({ message: 'Invalid track. Use html, css, javascript, or react.' });
    }

    const questions = getTrackQuestions(trackKey) || [];
    const answersMap = normalizeAnswersMap(req.body?.answers);
    if (Object.keys(answersMap).length === 0) {
      return res.status(400).json({ message: 'Please submit at least one answer.' });
    }

    const answers = questions.map((question) => {
      const selectedIndex = Number.isInteger(answersMap[question.id]) ? answersMap[question.id] : -1;
      const isCorrect = selectedIndex === question.correctIndex;
      return {
        questionId: question.id,
        selectedIndex,
        isCorrect,
      };
    });

    const score = answers.reduce((count, item) => (item.isCorrect ? count + 1 : count), 0);
    const totalQuestions = questions.length;
    const percentage = Number(((score / totalQuestions) * 100).toFixed(2));
    const passed = percentage > PASS_PERCENTAGE;

    const attempt = await QuizAttempt.create({
      ownerId: req.userId,
      track: trackKey,
      totalQuestions,
      score,
      percentage,
      passed,
      answers,
    });

    return res.status(201).json({
      message: 'Quiz submitted successfully. Your score is now available.',
      attemptId: String(attempt._id),
      track: toTrackPayload(trackKey),
      score: attempt.score,
      totalQuestions,
      percentage: attempt.percentage,
      passed: attempt.passed,
      submittedAt: attempt.createdAt,
      completedAt: attempt.createdAt,
      passPercentage: PASS_PERCENTAGE,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit quiz', error: error.message });
  }
};

const getLatestScore = async (req, res) => {
  try {
    const trackKey = resolveTrackKey(req.params.track);
    if (!trackKey) {
      return res.status(400).json({ message: 'Invalid track. Use html, css, javascript, or react.' });
    }

    const latestAttempt = await QuizAttempt.findOne({
      ownerId: req.userId,
      track: trackKey,
    }).sort({ createdAt: -1 });

    if (!latestAttempt) {
      return res.status(404).json({ message: 'No attempt found for this track yet.' });
    }

    return res.status(200).json({
      track: toTrackPayload(trackKey),
      score: latestAttempt.score,
      totalQuestions: latestAttempt.totalQuestions,
      percentage: latestAttempt.percentage,
      passed: latestAttempt.passed,
      passPercentage: PASS_PERCENTAGE,
      completedAt: latestAttempt.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch quiz score', error: error.message });
  }
};

const getCertificateData = async (req, res) => {
  try {
    const requestedFormat = String(req.query?.format || 'png').trim().toLowerCase();
    if (!CERTIFICATE_FORMATS.includes(requestedFormat)) {
      return res.status(400).json({ message: 'Invalid certificate format. Use png or pdf.' });
    }

    const trackKey = resolveTrackKey(req.params.track);
    if (!trackKey) {
      return res.status(400).json({ message: 'Invalid track. Use html, css, javascript, or react.' });
    }

    const latestAttempt = await QuizAttempt.findOne({
      ownerId: req.userId,
      track: trackKey,
    }).sort({ createdAt: -1 });

    if (!latestAttempt) {
      return res.status(404).json({ message: 'No attempt found for this track yet.' });
    }

    if (!latestAttempt.passed) {
      return res.status(400).json({
        message: 'You must score above 60% to generate a certificate.',
      });
    }

    const user = await User.findById(req.userId).select('fullName subscription');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userPlan = normalizePlan(user.subscription);
    const isFreePlan = userPlan === 'free';

    if (isFreePlan) {
      return res.status(403).json({
        message: 'Certificates are available on basic, standard, and premium plans only.',
      });
    }

    const studentName = user?.fullName || 'DevPortix Student';
    const trackLabel = QUIZ_TRACKS[trackKey].label;
    const certificateId = `DVP-${String(latestAttempt._id).slice(-8).toUpperCase()}`;

    return res.status(200).json({
      certificate: {
        certificateId,
        studentName,
        track: trackLabel,
        format: requestedFormat,
        score: latestAttempt.score,
        totalQuestions: latestAttempt.totalQuestions,
        percentage: latestAttempt.percentage,
        passed: latestAttempt.passed,
        issuedBy: 'DevPortix',
        completedAt: latestAttempt.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate certificate data', error: error.message });
  }
};

module.exports = {
  listQuizTracks,
  getQuizQuestions,
  submitQuiz,
  getLatestScore,
  getCertificateData,
};
