const jwt = require('jsonwebtoken');

const validateUser = (req, res, next) => {
  try {
    // Grab access token from Authorization: Bearer <token>
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token || token === authHeader) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const decodedData = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWTSECRET || 'devport_dev_secret'
    );

    req.userData = decodedData;
    req.userId = decodedData.sub;

    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = validateUser;
