const requireVerifiedUser = async (req, res, next) => {
  return next();
};

module.exports = requireVerifiedUser;
