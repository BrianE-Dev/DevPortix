const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./database/dbconnection');
const portfolioRoutes = require('./routes/portfolioRoutes');

const PORTFOLIO_SERVICE_PORT = Number(process.env.PORTFOLIO_SERVICE_PORT) || 5601;
const app = express();
app.set('etag', false);

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'portfolio-service' });
});

app.use('/api/portfolios', portfolioRoutes);

connectDB();

app.listen(PORTFOLIO_SERVICE_PORT, () => {
  console.log(`Portfolio service running on http://localhost:${PORTFOLIO_SERVICE_PORT}`);
});
