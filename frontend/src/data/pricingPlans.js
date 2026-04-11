const formatNaira = (amount) => `NGN ${Number(amount || 0).toLocaleString('en-NG')}`;

const formatDiscountLabel = (percentage) => `${String(percentage).replace(/\.0$/, '')}% off`;
const toAnnualAmount = (monthlyAmount, discountPercentage) =>
  Math.round(Number(monthlyAmount) * 12 * (1 - Number(discountPercentage || 0) / 100));

const createBillingOption = (monthlyAmount, annualDiscountPercentage) => {
  const annualAmount = toAnnualAmount(monthlyAmount, annualDiscountPercentage);

  return {
    monthly: {
      priceLabel: formatNaira(monthlyAmount),
      periodLabel: '/month',
      amount: Number(monthlyAmount),
      savingsLabel: '',
    },
    annual: {
      priceLabel: formatNaira(annualAmount),
      periodLabel: '/year',
      amount: annualAmount,
      savingsLabel: formatDiscountLabel(annualDiscountPercentage),
    },
  };
};

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individual instructors getting started',
    buttonText: 'Get Started Free',
    popular: false,
    color: 'from-gray-600 to-gray-700',
    billing: {
      monthly: {
        priceLabel: 'NGN 0',
        periodLabel: '',
        amount: 0,
        savingsLabel: '',
      },
      annual: {
        priceLabel: 'NGN 0',
        periodLabel: '',
        amount: 0,
        savingsLabel: '',
      },
    },
    features: [
      'Up to 4 students',
      'Take HTML, CSS, JavaScript, and React quizzes (10 questions each)',
      'Instructor workspace and basic student tracking',
      'Quiz score visibility included',
      'No certificates',
      'Portfolio access requires upgrade',
      'Email support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For active instructors with growing cohorts',
    buttonText: 'Choose Basic',
    popular: true,
    color: 'from-blue-600 to-purple-600',
    annualDiscountPercentage: 8.5,
    billing: createBillingOption(5000, 8.5),
    features: [
      'Up to 20 students',
      'Quiz score visibility included',
      'Certificates included (PNG + PDF)',
      'Portfolio access and customization unlocked',
      'Progress tracking and review tools',
      'Email support',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'For structured training programs and schools',
    buttonText: 'Choose Standard',
    popular: false,
    color: 'from-cyan-600 to-blue-600',
    annualDiscountPercentage: 8.5,
    billing: createBillingOption(12000, 8.5),
    features: [
      'Up to 100 students',
      'Everything in Basic',
      'Certificates included (PNG + PDF)',
      'Portfolio access for all enrolled paid users',
      'Advanced analytics and reporting',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For professionals operating at scale',
    buttonText: 'Choose Premium',
    popular: false,
    color: 'from-amber-500 to-orange-600',
    annualDiscountPercentage: 14,
    billing: createBillingOption(20000, 14),
    features: [
      'Up to 250 students',
      'Everything in Standard',
      'Certificates included (PNG + PDF)',
      'Advanced portfolio collaboration controls',
      'Advanced professional controls',
      'Priority support with faster response times',
    ],
  },
];
