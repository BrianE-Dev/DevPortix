const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./database/dbconnection');
const quizRoutes = require('./routes/quizRoutes');

const QUIZ_SERVICE_PORT = Number(process.env.QUIZ_SERVICE_PORT) || 5602;
const app = express();
app.set('etag', false);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'quiz-service' });
});

app.use('/api/quizzes', quizRoutes);

connectDB();

app.listen(QUIZ_SERVICE_PORT, () => {
  console.log(`Quiz service running on http://localhost:${QUIZ_SERVICE_PORT}`);
});
