const User = require('../modules/userSchema');

const requireRole = (allowedRoles = []) => {
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map((role) => String(role).trim().toLowerCase())
    : [String(allowedRoles).trim().toLowerCase()];

  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      const user = await User.findById(req.userId).select('role');
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      const userRole = String(user.role || '').trim().toLowerCase();
      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.userRole = userRole;
      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization failed', error: error.message });
    }
  };
};

module.exports = requireRole;

