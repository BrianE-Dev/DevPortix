// src/components/Pricing.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, LoaderCircle, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PRICING_PLANS } from '../data/pricingPlans';
import LocalStorageService from '../services/localStorageService';
import { paymentApi } from '../services/paymentApi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getRecommendedPlanForRole, roleRequiresPaidPlan } from '../utils/accessControl';

const Pricing = () => {
  const { isAuthenticated, loading, user, setAuthenticatedUser } = useAuth();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activePlanId, setActivePlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [paymentFeedback, setPaymentFeedback] = useState({ tone: '', message: '' });
  const isDark = theme === 'dark';
  const currentPlan = useMemo(() => String(user?.subscription || 'free').toLowerCase(), [user?.subscription]);
  const currentBillingCycle = useMemo(
    () => String(user?.subscriptionBillingCycle || 'monthly').toLowerCase(),
    [user?.subscriptionBillingCycle]
  );
  const isOrganization = String(user?.role || '').toLowerCase() === 'organization';
  const requiresPaidPlan = roleRequiresPaidPlan(user?.role);
  const visiblePlans = useMemo(
    () => (requiresPaidPlan ? PRICING_PLANS.filter((plan) => plan.id !== 'free') : PRICING_PLANS),
    [requiresPaidPlan]
  );
  const callbackReference = searchParams.get('reference') || searchParams.get('trxref');
  const callbackStatus = String(searchParams.get('status') || '').trim().toLowerCase();
  const requiredPlan = searchParams.get('required');
  const requestedPlan = searchParams.get('plan');
  const callbackBillingCycle = String(searchParams.get('billingCycle') || '').trim().toLowerCase();
  const [resolvedPlan, setResolvedPlan] = useState(currentPlan);

  useEffect(() => {
    setResolvedPlan(currentPlan);
  }, [currentPlan]);

  useEffect(() => {
    setBillingCycle(currentBillingCycle === 'annual' ? 'annual' : 'monthly');
  }, [currentBillingCycle]);

  useEffect(() => {
    const verifyFromCallback = async () => {
      if (!callbackReference || loading) return;

      if (!isAuthenticated) {
        setPaymentFeedback({
          tone: 'error',
          message: 'Please sign in again to complete payment verification.',
        });
        setError('Please sign in again to complete payment verification.');
        setNotice('');
        navigate('/login', { replace: true });
        return;
      }

      if (callbackStatus && callbackStatus !== 'success') {
        setPaymentFeedback({
          tone: 'error',
          message: 'Payment was not completed. You can try again whenever you are ready.',
        });
        setError('Payment was not completed. You can try again whenever you are ready.');
        setNotice('');
        navigate('/pricing', { replace: true });
        return;
      }

      const token = LocalStorageService.getToken();
      if (!token) {
        setPaymentFeedback({
          tone: 'error',
          message: 'Please sign in again to complete payment verification.',
        });
        setError('Please sign in again to complete payment verification.');
        setNotice('');
        navigate('/login', { replace: true });
        return;
      }

      try {
        setActivePlanId('verify');
        setPaymentFeedback({
          tone: 'loading',
          message: 'Confirming your payment with Paystack...',
        });
        setNotice('Confirming your payment...');
        setError('');
        const response = await paymentApi.verify(token, callbackReference);
        setAuthenticatedUser(response.user);
        setResolvedPlan(String(response.plan || currentPlan).toLowerCase());
        const resolvedBillingCycle = String(response.billingCycle || callbackBillingCycle || 'monthly').toLowerCase();
        setBillingCycle(resolvedBillingCycle === 'annual' ? 'annual' : 'monthly');
        setPaymentFeedback({
          tone: 'success',
          message: `Payment successful. Your subscription is now ${String(response.plan).toUpperCase()} billed ${resolvedBillingCycle === 'annual' ? 'annually' : 'monthly'}.`,
        });
        setNotice(`Payment successful. Your subscription is now ${String(response.plan).toUpperCase()} billed ${resolvedBillingCycle === 'annual' ? 'annually' : 'monthly'}.`);
        navigate('/pricing', { replace: true });
      } catch (verificationError) {
        setPaymentFeedback({
          tone: 'error',
          message: verificationError?.message || 'Unable to verify payment right now.',
        });
        setError(verificationError?.message || 'Unable to verify payment right now.');
      } finally {
        setActivePlanId('');
      }
    };

    verifyFromCallback();
  }, [callbackBillingCycle, callbackReference, callbackStatus, currentPlan, isAuthenticated, loading, navigate, setAuthenticatedUser]);

  useEffect(() => {
    if (!requiredPlan || !requiresPaidPlan) {
      return;
    }

    const recommendedPlan = requestedPlan || getRecommendedPlanForRole(user?.role);
    setNotice(
      `${isOrganization ? 'Organization' : 'Professional'} accounts require a paid plan before full access. Choose ${String(recommendedPlan).toUpperCase()} or another paid plan to continue.`
    );
  }, [isOrganization, requestedPlan, requiredPlan, requiresPaidPlan, user?.role]);

  const handlePlanCheckout = async (planId) => {
    const plan = String(planId || '').toLowerCase();
    if (isOrganization && plan === 'free') {
      setError('Free plan is not available for organization accounts.');
      setNotice('');
      return;
    }

    if (plan === 'free') {
      setNotice('Free plan is available immediately. Create an account to get started.');
      setError('');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (plan === resolvedPlan && plan !== 'free' && billingCycle === currentBillingCycle) {
      setNotice(`You are already on the ${plan.toUpperCase()} plan billed ${billingCycle}.`);
      setError('');
      return;
    }

    const token = LocalStorageService.getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setActivePlanId(plan);
      setError('');
      setNotice('');
      const response = await paymentApi.initialize(token, plan, billingCycle);
      window.location.assign(response.authorizationUrl);
    } catch (checkoutError) {
      setError(checkoutError?.message || 'Unable to start checkout right now.');
      setActivePlanId('');
    }
  };

  const paymentFeedbackConfig = {
    loading: {
      className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
      icon: LoaderCircle,
      iconClassName: 'animate-spin text-cyan-300',
      title: 'Confirming payment',
    },
    success: {
      className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
      icon: Check,
      iconClassName: 'text-emerald-300',
      title: 'Payment confirmed',
    },
    error: {
      className: 'border-red-400/30 bg-red-500/10 text-red-100',
      icon: AlertCircle,
      iconClassName: 'text-red-300',
      title: 'Payment issue',
    },
  };

  const activePaymentFeedback = paymentFeedback.tone
    ? paymentFeedbackConfig[paymentFeedback.tone]
    : null;
  const PaymentFeedbackIcon = activePaymentFeedback?.icon || null;
  const sectionClass = isDark
    ? 'app-dark-section'
    : 'bg-[linear-gradient(180deg,#e0f2fe_0%,#dbeafe_40%,#e9d5ff_100%)]';

  return (
    <section id="pricing" className={`${sectionClass} py-20 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className={`text-lg max-w-3xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
          <div className={`mx-auto mt-8 inline-flex rounded-full border p-1 shadow-sm ${isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white/80'}`}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${billingCycle === 'monthly' ? 'bg-slate-900 text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${billingCycle === 'annual' ? 'bg-slate-900 text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Annual
            </button>
          </div>
          <p className={`mt-3 text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Annual discounts vary by plan: Basic 8.5% off, Standard 8.5% off, Premium 14% off.
          </p>
        </div>

        {activePaymentFeedback && PaymentFeedbackIcon && (
          <div className={`mb-8 rounded-3xl border px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.25)] ${activePaymentFeedback.className}`}>
            <div className="flex items-start gap-3">
              <PaymentFeedbackIcon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${activePaymentFeedback.iconClassName}`} />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                  {activePaymentFeedback.title}
                </p>
                <p className="mt-1 text-sm leading-6">
                  {paymentFeedback.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${requiresPaidPlan ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
          {visiblePlans.map((plan, index) => (
            (() => {
              const isCurrentPlan = plan.id === resolvedPlan;
              const isCurrentBillingCycle = billingCycle === currentBillingCycle;
              const isPopular = plan.popular;
              const activeBilling = plan.billing?.[billingCycle] || plan.billing?.monthly || {};
              const glassSurfaceClass = isDark
                ? plan.id === 'basic'
                  ? 'bg-[linear-gradient(180deg,rgba(76,29,149,0.24),rgba(15,23,42,0.92)),radial-gradient(circle_at_top_left,rgba(196,181,253,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.12),transparent_38%)]'
                  : plan.id === 'standard'
                    ? 'bg-[linear-gradient(180deg,rgba(8,47,73,0.24),rgba(15,23,42,0.92)),radial-gradient(circle_at_top_left,rgba(103,232,249,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_38%)]'
                    : plan.id === 'premium'
                      ? 'bg-[linear-gradient(180deg,rgba(120,53,15,0.24),rgba(15,23,42,0.92)),radial-gradient(circle_at_top_left,rgba(253,186,116,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_38%)]'
                      : 'bg-[linear-gradient(180deg,rgba(30,41,59,0.78),rgba(15,23,42,0.92)),radial-gradient(circle_at_top_left,rgba(148,163,184,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_38%)]'
                : plan.id === 'basic'
                  ? 'bg-[linear-gradient(180deg,rgba(245,243,255,0.92),rgba(233,213,255,0.62)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(196,181,253,0.2),transparent_38%)]'
                  : plan.id === 'standard'
                    ? 'bg-[linear-gradient(180deg,rgba(236,254,255,0.92),rgba(186,230,253,0.58)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(103,232,249,0.2),transparent_38%)]'
                    : plan.id === 'premium'
                      ? 'bg-[linear-gradient(180deg,rgba(255,247,237,0.92),rgba(254,215,170,0.56)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_38%)]'
                      : 'bg-[linear-gradient(180deg,rgba(239,246,255,0.94),rgba(191,219,254,0.56)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.18),transparent_38%)]';
              const cardAccentClass = plan.id === 'basic'
                ? isDark
                  ? 'border-violet-400/35 shadow-[0_18px_55px_rgba(139,92,246,0.18)]'
                  : 'border-violet-300/70 shadow-[0_18px_48px_rgba(139,92,246,0.16)]'
                : plan.id === 'standard'
                  ? isDark
                    ? 'border-cyan-400/35 shadow-[0_18px_55px_rgba(34,211,238,0.16)]'
                    : 'border-cyan-300/70 shadow-[0_18px_48px_rgba(34,211,238,0.14)]'
                  : plan.id === 'premium'
                    ? isDark
                      ? 'border-amber-400/35 shadow-[0_18px_55px_rgba(251,191,36,0.14)]'
                      : 'border-amber-300/70 shadow-[0_18px_48px_rgba(251,191,36,0.14)]'
                    : '';
              const titleClass = plan.id === 'free'
                ? isDark ? 'text-white' : 'text-slate-900'
                : plan.id === 'basic'
                  ? isDark
                    ? 'text-violet-300'
                    : 'text-violet-700'
                  : plan.id === 'standard'
                    ? isDark
                      ? 'text-cyan-400'
                      : 'text-cyan-700'
                    : isDark
                      ? 'text-orange-400'
                      : 'text-orange-500';
              const bodyTextClass = isDark ? 'text-slate-300' : 'text-slate-700';
              const featureTextClass = isDark ? 'text-slate-200' : 'text-slate-800';
              const priceClass = isDark ? 'text-white' : 'text-slate-900';
              const buttonClass = isPopular
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_14px_30px_rgba(139,92,246,0.35)] hover:opacity-95'
                : plan.id === 'standard'
                  ? isDark
                    ? 'border border-cyan-500/60 bg-transparent text-cyan-400 hover:bg-cyan-500/10'
                    : 'border border-cyan-600/70 bg-transparent text-cyan-700 hover:bg-cyan-100'
                  : plan.id === 'premium'
                    ? 'bg-orange-500 text-white hover:bg-orange-400'
                    : isDark
                      ? 'border border-white/10 bg-white/8 text-white hover:bg-white/12'
                      : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100';
              const iconClass = plan.id === 'premium' ? 'text-orange-400' : 'text-emerald-400';

              return (
            <div
              key={plan.id}
              className={`pricing-glass-card relative mx-auto w-full max-w-md overflow-visible rounded-[22px] border p-7 backdrop-blur-[22px] ${glassSurfaceClass} ${isPopular ? 'pt-12' : ''} ${cardAccentClass}`}
              style={{ animationDelay: `${index * 0.55}s` }}
            >
              {isPopular && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform">
                  <div className="flex items-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(139,92,246,0.32)]">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8 text-left">
                <h3 className={`mb-3 text-[1.7rem] font-bold ${titleClass}`}>{plan.name}</h3>
                <div className="mb-2 flex items-end gap-2">
                  <span className={`text-5xl font-bold ${priceClass}`}>{activeBilling.priceLabel}</span>
                  {activeBilling.periodLabel ? <span className={`mb-1 ${bodyTextClass}`}>{activeBilling.periodLabel}</span> : null}
                </div>
                {activeBilling.savingsLabel ? (
                  <p className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {activeBilling.savingsLabel}
                  </p>
                ) : null}
                <p className={`max-w-xs text-sm leading-6 ${bodyTextClass}`}>{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className={`mt-1 mr-3 h-4 w-4 flex-shrink-0 ${iconClass}`} />
                    <span className={featureTextClass}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handlePlanCheckout(plan.id)}
                disabled={activePlanId === plan.id || activePlanId === 'verify'}
                className={`w-full rounded-xl py-3.5 px-4 font-semibold transition ${buttonClass} disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {activePlanId === plan.id
                  ? 'Redirecting...'
                  : isCurrentPlan && (plan.id === 'free' || isCurrentBillingCycle)
                    ? 'Current Plan'
                    : isCurrentPlan
                      ? `Switch to ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`
                    : plan.buttonText}
              </button>
            </div>
              );
            })()
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className={`italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {isOrganization
              ? `Organization accounts start from Basic and can upgrade anytime with ${billingCycle} billing.`
              : `Start free and upgrade anytime as your student base grows with ${billingCycle} billing.`}
          </p>
          <div className="mx-auto mt-6 grid max-w-5xl gap-4 text-left">
            <p className={`rounded-2xl border px-5 py-4 text-sm leading-7 backdrop-blur-md ${
              isDark
                ? 'border-blue-300/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(2,6,23,0.16)]'
                : 'border-blue-300/70 bg-white/35 text-blue-700'
            }`}>
              Instructors can start with the plan that fits their current student size, then upgrade smoothly as cohorts, assessments, and review workflows expand.
            </p>
            <p className={`rounded-2xl border px-5 py-4 text-sm leading-7 backdrop-blur-md ${
              isDark
                ? 'border-blue-300/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(2,6,23,0.16)]'
                : 'border-blue-300/70 bg-white/35 text-blue-700'
            }`}>
              Organizations and training schools can choose structured plans built for larger enrollments, cleaner reporting, and stronger operational visibility.
            </p>
            <p className={`rounded-2xl border px-5 py-4 text-sm leading-7 backdrop-blur-md ${
              isDark
                ? 'border-blue-300/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(2,6,23,0.16)]'
                : 'border-blue-300/70 bg-white/35 text-blue-700'
            }`}>
              Students benefit from plans that unlock portfolio access, progress tracking, certificates, and a more complete learning experience across the platform.
            </p>
            <p className={`rounded-2xl border px-5 py-4 text-sm leading-7 backdrop-blur-md ${
              isDark
                ? 'border-blue-300/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(2,6,23,0.16)]'
                : 'border-blue-300/70 bg-white/35 text-blue-700'
            }`}>
              Professionals can move to higher tiers when they need advanced portfolio controls, collaboration tools, and stronger support as their work grows.
            </p>
          </div>
          {notice && <p className="text-green-300 mt-3">{notice}</p>}
          {error && <p className="text-red-300 mt-3">{error}</p>}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
