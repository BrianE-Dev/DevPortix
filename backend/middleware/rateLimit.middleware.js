const createMemoryRateLimiter = ({
  windowMs,
  maxRequests,
  message,
  keyGenerator,
}) => {
  const store = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))));
      return res.status(429).json({ message });
    }

    current.count += 1;
    store.set(key, current);
    return next();
  };
};

const clientIpKey = (req) =>
  String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
    .toLowerCase();

const registrationOtpRequestLimiter = createMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many OTP requests from this IP. Please wait a minute and try again.',
  keyGenerator: clientIpKey,
});

const registrationOtpVerifyLimiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many verification attempts from this IP. Please try again later.',
  keyGenerator: clientIpKey,
});

module.exports = {
  registrationOtpRequestLimiter,
  registrationOtpVerifyLimiter,
};
