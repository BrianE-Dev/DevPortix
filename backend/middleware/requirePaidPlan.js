const User = require('../modules/userSchema');

const DEFAULT_UPGRADE_MESSAGE =
  'Please upgrade to a better plan to access this feature.';

const normalizePlan = (value) => String(value || 'free').trim().toLowerCase();

const requirePaidPlan = (message = DEFAULT_UPGRADE_MESSAGE) =>
  async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      const user = await User.findById(req.userId).select('subscription').lean();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const plan = normalizePlan(user.subscription);
      if (plan === 'free') {
        return res.status(403).json({
          code: 'PLAN_UPGRADE_REQUIRED',
          message,
        });
      }

      req.userSubscription = plan;
      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Failed to validate subscription', error: error.message });
    }
  };

module.exports = {
  requirePaidPlan,
  DEFAULT_UPGRADE_MESSAGE,
};
