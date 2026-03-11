const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./database/dbconnection');
const authRoutes = require('./src/backend/routes/authRoutes');
const userRoutes = require('./src/backend/routes/userRoutes');
const projectRoutes = require('./src/backend/routes/projectRoutes');
const portfolioRoutes = require('./src/backend/routes/portfolioRoutes');
const adminRoutes = require('./src/backend/routes/adminRoutes');
const communityRoutes = require('./src/backend/routes/communityRoutes');
const paymentRoutes = require('./src/backend/routes/paymentRoutes');
const orderRoutes = require('./src/backend/order/order.router');
const mentorshipRoutes = require('./src/backend/routes/mentorshipRoutes');

const EXPRESSPORT = Number(process.env.PORT) || 5500;
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

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mentorship', mentorshipRoutes);

connectDB();

app.listen(EXPRESSPORT, () => {
  console.log(`Server running on http://localhost:${EXPRESSPORT}`);
});
