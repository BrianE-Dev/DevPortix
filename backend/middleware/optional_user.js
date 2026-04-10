const jwt = require('jsonwebtoken');

const optionalUser = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token || token === authHeader) {
      return next();
    }

    const decodedData = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWTSECRET || 'devportix_dev_secret'
    );

    req.userData = decodedData;
    req.userId = decodedData.sub;
    return next();
  } catch (_error) {
    return next();
  }
};

module.exports = optionalUser;
