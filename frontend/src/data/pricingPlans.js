import pricingPlanCatalog from '../../../shared/pricingPlans.json';

const formatNaira = (amount) => `NGN ${Number(amount || 0).toLocaleString('en-NG')}`;

const formatDiscountLabel = (percentage) => `${String(percentage).replace(/\.0$/, '')}% off`;
const toAnnualAmount = (monthlyAmount, discountPercentage) =>
  Math.round(Number(monthlyAmount) * 12 * (1 - Number(discountPercentage || 0) / 100));

const createBillingOption = (monthlyAmount, annualDiscountPercentage) => {
  const annualAmount = toAnnualAmount(monthlyAmount, annualDiscountPercentage);

  return {
    monthly: {
      priceLabel: formatNaira(monthlyAmount),
      periodLabel: monthlyAmount > 0 ? '/month' : '',
      amount: Number(monthlyAmount),
      savingsLabel: '',
    },
    annual: {
      priceLabel: formatNaira(annualAmount),
      periodLabel: annualAmount > 0 ? '/year' : '',
      amount: annualAmount,
      savingsLabel: annualDiscountPercentage ? formatDiscountLabel(annualDiscountPercentage) : '',
    },
  };
};

export const PRICING_PLANS = pricingPlanCatalog.map((plan) => ({
  ...plan,
  billing: createBillingOption(plan.monthlyAmount, plan.annualDiscountPercentage),
}));
