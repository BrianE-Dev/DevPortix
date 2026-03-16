const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./database/dbconnection');
const quizRoutes = require('./routes/quizRoutes');

const QUIZ_SERVICE_PORT = Number(process.env.PORT || process.env.QUIZ_SERVICE_PORT) || 5602;
const app = express();
app.set('etag', false);

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');
const allowedOrigins = String(process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);
if (!allowedOrigins.includes('https://dev-portix.vercel.app')) {
  allowedOrigins.push('https://dev-portix.vercel.app');
}

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('/{*any}', cors(corsOptions));
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
