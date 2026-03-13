const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const Paystack = /** @type {any} */ (require('paystack-api')(
  process.env.PAYSTACK_SECRET_KEY || process.env.PSSECRET || ''
));

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PSSECRET || '';

const PLAN_PRICING = {
  basic: {
    amountKobo: 100000,
    currency: 'NGN',
  },
  standard: {
    amountKobo: 300000,
    currency: 'NGN',
  },
  premium: {
    amountKobo: 600000,
    currency: 'NGN',
  },
};

const isSupportedPaidPlan = (plan) => ['basic', 'standard', 'premium'].includes(plan);

const resolveFrontendBaseUrl = (req) => {
  const configured = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL;
  if (configured) return String(configured).replace(/\/+$/, '');

  const originHeader = req.get('origin');
  if (originHeader) return String(originHeader).replace(/\/+$/, '');

  return `${req.protocol}://${req.get('host')}`;
};

const initializeSubscriptionPayment = async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const plan = String(req.body?.plan || '').trim().toLowerCase();
    if (!isSupportedPaidPlan(plan)) {
      return res.status(400).json({ message: 'Unsupported plan. Use "basic", "standard", or "premium".' });
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (String(user.role || '').trim().toLowerCase() === 'organization' && plan === 'free') {
      return res.status(403).json({ message: 'Free plan is not available for organization accounts.' });
    }

    const pricing = PLAN_PRICING[plan];
    const reference = `devportix_${req.userId}_${plan}_${Date.now()}`;
    const callbackUrl = `${resolveFrontendBaseUrl(req)}/pricing?plan=${encodeURIComponent(plan)}`;

    const payload = {
      email: user.email,
      amount: pricing.amountKobo,
      currency: pricing.currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId: String(user._id),
        plan,
        product: 'devportix_subscription',
      },
    };

    const data = await Paystack.transaction.initialize(payload);
    if (!data?.status || !data?.data?.authorization_url) {
      return res.status(502).json({
        message: 'Failed to initialize Paystack payment',
        error: data?.message || 'Payment provider error',
      });
    }

    return res.status(200).json({
      message: 'Payment initialized',
      plan,
      reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      amountKobo: pricing.amountKobo,
      currency: pricing.currency,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initialize payment', error: error.message });
  }
};

const verifySubscriptionPayment = async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const reference = String(req.params.reference || '').trim();
    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    const data = await Paystack.transaction.verify({ reference });
    const transaction = data?.data;
    if (!data?.status || !transaction) {
      return res.status(502).json({
        message: 'Failed to verify Paystack payment',
        error: data?.message || 'Payment provider error',
      });
    }

    const paid = transaction.status === 'success';
    const metadata = transaction.metadata || {};
    const paidPlan = String(metadata.plan || '').trim().toLowerCase();
    const paidUserId = String(metadata.userId || '').trim();

    if (!paid || !isSupportedPaidPlan(paidPlan)) {
      return res.status(400).json({
        message: 'Payment is not successful for a supported plan',
        paymentStatus: transaction.status,
      });
    }

    if (paidUserId && paidUserId !== String(req.userId)) {
      return res.status(403).json({ message: 'This payment does not belong to the current user' });
    }

    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const updatedSubscription = await Subscription.findOneAndUpdate(
      { ownerId: req.userId },
      {
        $set: {
          plan: paidPlan,
          status: 'active',
          renewalDate,
          providerCustomerId: transaction.customer?.customer_code || null,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { subscription: paidPlan } },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Payment verified and subscription updated',
      plan: updatedSubscription.plan,
      renewalDate: updatedSubscription.renewalDate,
      paymentStatus: transaction.status,
      reference: transaction.reference,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        githubUsername: user.githubUsername,
        avatar: user.avatar,
        subscription: user.subscription,
        skills: Array.isArray(user.skills) ? user.skills : [],
        dashboardMenu: user.dashboardMenu || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

module.exports = {
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
};
