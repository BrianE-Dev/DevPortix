const crypto = require('crypto');
const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const Paystack = /** @type {any} */ (require('paystack-api')(
  process.env.PAYSTACK_SECRET_KEY || process.env.PSSECRET || ''
));

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PSSECRET || '';

const PLAN_PRICING = {
  basic: {
    monthlyAmountKobo: 500000,
    annualDiscountPercentage: 8.5,
    currency: 'NGN',
  },
  standard: {
    monthlyAmountKobo: 1200000,
    annualDiscountPercentage: 8.5,
    currency: 'NGN',
  },
  premium: {
    monthlyAmountKobo: 2000000,
    annualDiscountPercentage: 14,
    currency: 'NGN',
  },
};

const isSupportedPaidPlan = (plan) => ['basic', 'standard', 'premium'].includes(plan);
const isSupportedBillingCycle = (value) => ['monthly', 'annual'].includes(value);

const addMonths = (count) => {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + count);
  return renewalDate;
};

const resolvePricingForCycle = (plan, billingCycle) => {
  const pricing = PLAN_PRICING[plan];
  if (!pricing) return null;

  const monthlyAmountKobo = Number(pricing.monthlyAmountKobo || 0);
  const annualDiscountMultiplier = 1 - Number(pricing.annualDiscountPercentage || 0) / 100;
  const annualAmountKobo = Math.round(monthlyAmountKobo * 12 * annualDiscountMultiplier);

  return {
    currency: pricing.currency,
    amountKobo: billingCycle === 'annual' ? annualAmountKobo : monthlyAmountKobo,
  };
};

const applySuccessfulSubscriptionPayment = async ({ userId, plan, billingCycle, customerCode }) => {
  const renewalDate = billingCycle === 'annual' ? addMonths(12) : addMonths(1);

  const updatedSubscription = await Subscription.findOneAndUpdate(
    { ownerId: userId },
    {
      $set: {
        plan,
        billingCycle,
        status: 'active',
        renewalDate,
        providerCustomerId: customerCode || null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { subscription: plan, subscriptionBillingCycle: billingCycle } },
    { new: true }
  ).lean();

  return { updatedSubscription, user };
};

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
    const billingCycle = String(req.body?.billingCycle || 'monthly').trim().toLowerCase();
    if (!isSupportedPaidPlan(plan)) {
      return res.status(400).json({ message: 'Unsupported plan. Use "basic", "standard", or "premium".' });
    }
    if (!isSupportedBillingCycle(billingCycle)) {
      return res.status(400).json({ message: 'Unsupported billing cycle. Use "monthly" or "annual".' });
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (String(user.role || '').trim().toLowerCase() === 'organization' && plan === 'free') {
      return res.status(403).json({ message: 'Free plan is not available for organization accounts.' });
    }

    const pricing = resolvePricingForCycle(plan, billingCycle);
    const reference = `devportix_${req.userId}_${plan}_${Date.now()}`;
    const callbackUrl = `${resolveFrontendBaseUrl(req)}/pricing?plan=${encodeURIComponent(plan)}&billingCycle=${encodeURIComponent(billingCycle)}`;

    const payload = {
      email: user.email,
      amount: pricing.amountKobo,
      currency: pricing.currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId: String(user._id),
        plan,
        billingCycle,
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
      billingCycle,
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
    const paidBillingCycle = String(metadata.billingCycle || 'monthly').trim().toLowerCase();
    const paidUserId = String(metadata.userId || '').trim();

    if (!paid || !isSupportedPaidPlan(paidPlan) || !isSupportedBillingCycle(paidBillingCycle)) {
      return res.status(400).json({
        message: 'Payment is not successful for a supported plan',
        paymentStatus: transaction.status,
      });
    }

    if (paidUserId && paidUserId !== String(req.userId)) {
      return res.status(403).json({ message: 'This payment does not belong to the current user' });
    }

    const { updatedSubscription, user } = await applySuccessfulSubscriptionPayment({
      userId: req.userId,
      plan: paidPlan,
      billingCycle: paidBillingCycle,
      customerCode: transaction.customer?.customer_code || null,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Payment verified and subscription updated',
      plan: updatedSubscription.plan,
      billingCycle: updatedSubscription.billingCycle,
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
        subscriptionBillingCycle: user.subscriptionBillingCycle || billingCycle,
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

const handlePaystackWebhook = async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: 'Paystack secret key is not configured' });
    }

    const signature = String(req.get('x-paystack-signature') || '').trim();
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : '';
    if (!signature || !rawBody) {
      return res.status(400).json({ message: 'Missing Paystack signature or raw body' });
    }

    const expectedSignature = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    const isSignatureValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isSignatureValid) {
      return res.status(401).json({ message: 'Invalid Paystack signature' });
    }

    const event = req.body || {};
    if (event.event !== 'charge.success') {
      return res.status(200).json({ received: true, ignored: true, event: event.event || null });
    }

    const transaction = event.data || {};
    const metadata = transaction.metadata || {};
    const product = String(metadata.product || '').trim().toLowerCase();
    const paidPlan = String(metadata.plan || '').trim().toLowerCase();
    const paidBillingCycle = String(metadata.billingCycle || 'monthly').trim().toLowerCase();
    const paidUserId = String(metadata.userId || '').trim();

    if (
      product !== 'devportix_subscription' ||
      !paidUserId ||
      !isSupportedPaidPlan(paidPlan) ||
      !isSupportedBillingCycle(paidBillingCycle)
    ) {
      return res.status(200).json({ received: true, ignored: true, reason: 'Unsupported webhook payload' });
    }

    const { user } = await applySuccessfulSubscriptionPayment({
      userId: paidUserId,
      plan: paidPlan,
      billingCycle: paidBillingCycle,
      customerCode: transaction.customer?.customer_code || null,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found for webhook payment' });
    }

    return res.status(200).json({
      received: true,
      processed: true,
      reference: transaction.reference || null,
      plan: paidPlan,
      billingCycle: paidBillingCycle,
      userId: paidUserId,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process Paystack webhook', error: error.message });
  }
};

module.exports = {
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
  handlePaystackWebhook,
};
