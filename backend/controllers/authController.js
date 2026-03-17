const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const PortfolioSettings = require('../modules/portfolioSettings');

const TOKEN_TTL = '7d';
const PUBLIC_SIGNUP_ROLES = new Set(['student', 'instructor', 'organization', 'professional']);
const DEFAULT_SUBSCRIPTION_BY_ROLE = {
  organization: 'basic',
};

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET || 'devportix_dev_secret', {
    expiresIn: TOKEN_TTL,
  });

const toPublicUser = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  githubUsername: userDoc.githubUsername,
  avatar: userDoc.avatar,
  bio: userDoc.bio || '',
  subscription: userDoc.subscription,
  skills: Array.isArray(userDoc.skills) ? userDoc.skills : [],
  dashboardMenu: userDoc.dashboardMenu || {},
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

const register = async (req, res) => {
  try {
    const { fullName, email, password, role, githubUsername } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const normalizedRole = String(role || 'student').trim().toLowerCase();
    const assignedRole = PUBLIC_SIGNUP_ROLES.has(normalizedRole) ? normalizedRole : 'student';
    const defaultPlan = DEFAULT_SUBSCRIPTION_BY_ROLE[assignedRole] || 'free';

    const user = await User.create({
      fullName: fullName?.trim() || 'New User',
      email: normalizedEmail,
      password: passwordHash,
      role: assignedRole,
      subscription: defaultPlan,
      githubUsername: githubUsername?.trim() || '',
    });

    await Promise.all([
      Subscription.create({ ownerId: user._id, plan: defaultPlan }),
      PortfolioSettings.create({ ownerId: user._id }),
    ]);

    const token = signToken(user._id);
    return res.status(201).json({
      message: 'registration successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(String(password), user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    return res.status(200).json({
      message: 'login successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = {
  register,
  login,
};
