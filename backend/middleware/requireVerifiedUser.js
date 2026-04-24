const User = require('../modules/userSchema');

const requireVerifiedUser = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    const user = await User.findById(req.userId).select('email emailVerified');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email address before continuing',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to validate email verification status',
      error: error.message,
    });
  }
};

module.exports = requireVerifiedUser;
