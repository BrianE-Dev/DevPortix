const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./backend/database/dbconnection');
const authRoutes = require('./backend/routes/authRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const projectRoutes = require('./backend/routes/projectRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const communityRoutes = require('./backend/routes/communityRoutes');
const paymentRoutes = require('./backend/routes/paymentRoutes');
const orderRoutes = require('./backend/order/order.router');
const mentorshipRoutes = require('./backend/routes/mentorshipRoutes');
const portfolioRoutes = require('./backend/routes/portfolioRoutes');
const quizRoutes = require('./backend/routes/quizRoutes');

const EXPRESSPORT = Number(process.env.PORT) || 5500;
const PORTFOLIO_SERVICE_URL = String(process.env.PORTFOLIO_SERVICE_URL || '').trim();
const QUIZ_SERVICE_URL = String(process.env.QUIZ_SERVICE_URL || '').trim();
const app = express();
app.set('etag', false);

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

const createProxyHandler = (baseUrl, serviceName) => async (req, res) => {
  try {
    const targetUrl = `${baseUrl}${req.originalUrl}`;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];

    const method = req.method.toUpperCase();
    const canHaveBody = method !== 'GET' && method !== 'HEAD';
    const body = canHaveBody ? JSON.stringify(req.body || {}) : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers: {
        ...headers,
        ...(canHaveBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
    });

    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.set('content-type', contentType);
    }
    const payload = await response.text();
    return res.send(payload);
  } catch (error) {
    return res.status(502).json({
      message: `${serviceName} unavailable`,
      error: error.message,
    });
  }
};

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mentorship', mentorshipRoutes);

if (PORTFOLIO_SERVICE_URL) {
  const proxyPortfolioRequest = createProxyHandler(PORTFOLIO_SERVICE_URL, 'Portfolio service');
  app.use('/api/portfolios', proxyPortfolioRequest);
} else {
  app.use('/api/portfolios', portfolioRoutes);
}

if (QUIZ_SERVICE_URL) {
  const proxyQuizRequest = createProxyHandler(QUIZ_SERVICE_URL, 'Quiz service');
  app.use('/api/quizzes', proxyQuizRequest);
} else {
  app.use('/api/quizzes', quizRoutes);
}

connectDB();

app.listen(EXPRESSPORT, () => {
  console.log(`Server running on http://localhost:${EXPRESSPORT}`);
});
