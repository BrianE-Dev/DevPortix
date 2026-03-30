// src/components/Pricing.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PRICING_PLANS } from '../data/pricingPlans';
import LocalStorageService from '../services/localStorageService';
import { paymentApi } from '../services/paymentApi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getRecommendedPlanForRole, roleRequiresPaidPlan } from '../utils/accessControl';

const Pricing = () => {
  const { isAuthenticated, user, setAuthenticatedUser } = useAuth();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activePlanId, setActivePlanId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const isDark = theme === 'dark';
  const currentPlan = useMemo(() => String(user?.subscription || 'free').toLowerCase(), [user?.subscription]);
  const isOrganization = String(user?.role || '').toLowerCase() === 'organization';
  const requiresPaidPlan = roleRequiresPaidPlan(user?.role);
  const visiblePlans = useMemo(
    () => (requiresPaidPlan ? PRICING_PLANS.filter((plan) => plan.id !== 'free') : PRICING_PLANS),
    [requiresPaidPlan]
  );
  const callbackReference = searchParams.get('reference') || searchParams.get('trxref');
  const requiredPlan = searchParams.get('required');
  const requestedPlan = searchParams.get('plan');
  const [resolvedPlan, setResolvedPlan] = useState(currentPlan);

  useEffect(() => {
    setResolvedPlan(currentPlan);
  }, [currentPlan]);

  useEffect(() => {
    const verifyFromCallback = async () => {
      if (!callbackReference || !isAuthenticated) return;

      const token = LocalStorageService.getToken();
      if (!token) return;

      try {
        setActivePlanId('verify');
        setError('');
        const response = await paymentApi.verify(token, callbackReference);
        setAuthenticatedUser(response.user);
        setResolvedPlan(String(response.plan || currentPlan).toLowerCase());
        setNotice(`Payment successful. Your subscription is now ${String(response.plan).toUpperCase()}.`);
        navigate('/pricing', { replace: true });
      } catch (verificationError) {
        setError(verificationError?.message || 'Unable to verify payment right now.');
      } finally {
        setActivePlanId('');
      }
    };

    verifyFromCallback();
  }, [callbackReference, currentPlan, isAuthenticated, navigate, setAuthenticatedUser]);

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

    if (plan === resolvedPlan) {
      setNotice(`You are already on the ${plan.toUpperCase()} plan.`);
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
      const response = await paymentApi.initialize(token, plan);
      window.location.assign(response.authorizationUrl);
    } catch (checkoutError) {
      setError(checkoutError?.message || 'Unable to start checkout right now.');
      setActivePlanId('');
    }
  };

  return (
    <section id="pricing" className="bg-slate-950 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className={`text-lg max-w-3xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${requiresPaidPlan ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
          {visiblePlans.map((plan) => (
            (() => {
              const isCurrentPlan = plan.id === resolvedPlan;
              const isPopular = plan.popular;
              const cardClass = plan.id === 'free'
                ? 'border-white/10 bg-slate-900/70'
                : plan.id === 'basic'
                  ? 'border-violet-500/80 bg-slate-900/78 shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_22px_60px_rgba(76,29,149,0.24)]'
                  : plan.id === 'standard'
                    ? 'border-cyan-500/30 bg-slate-900/72'
                    : 'border-amber-600/35 bg-[linear-gradient(180deg,rgba(32,18,12,0.9),rgba(24,17,13,0.82))]';
              const titleClass = plan.id === 'free'
                ? 'text-white'
                : plan.id === 'basic'
                  ? isDark
                    ? 'text-violet-300'
                    : 'text-violet-700'
                  : plan.id === 'standard'
                    ? isDark
                      ? 'text-cyan-400'
                      : 'text-cyan-700'
                    : 'text-orange-400';
              const bodyTextClass = isDark || plan.id === 'premium' || plan.id === 'free' ? 'text-slate-300' : 'text-slate-600';
              const featureTextClass = isDark || plan.id === 'premium' || plan.id === 'free' ? 'text-slate-200' : 'text-slate-700';
              const priceClass = isDark || plan.id === 'premium' || plan.id === 'free' ? 'text-white' : 'text-slate-900';
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
              className={`relative mx-auto w-full max-w-md rounded-[22px] border p-7 transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <div className="flex items-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(139,92,246,0.32)]">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8 text-left">
                <h3 className={`mb-3 text-[1.7rem] font-bold ${titleClass}`}>{plan.name}</h3>
                <div className="mb-2 flex items-end gap-2">
                  <span className={`text-5xl font-bold ${priceClass}`}>{plan.price}</span>
                  {plan.period && <span className={`mb-1 ${bodyTextClass}`}>{plan.period}</span>}
                </div>
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
                  : isCurrentPlan
                    ? 'Current Plan'
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
              ? 'Organization accounts start from Basic and can upgrade anytime.'
              : 'Start free and upgrade anytime as your student base grows.'}
          </p>
          <div className="mx-auto mt-6 grid max-w-5xl gap-4 text-left md:grid-cols-2">
            <p className="rounded-2xl border border-white/8 bg-slate-900/55 px-5 py-4 text-sm leading-7 text-slate-200">
              Instructors can start with the plan that fits their current student size, then upgrade smoothly as cohorts, assessments, and review workflows expand.
            </p>
            <p className="rounded-2xl border border-white/8 bg-slate-900/55 px-5 py-4 text-sm leading-7 text-slate-200">
              Organizations and training schools can choose structured plans built for larger enrollments, cleaner reporting, and stronger operational visibility.
            </p>
            <p className="rounded-2xl border border-white/8 bg-slate-900/55 px-5 py-4 text-sm leading-7 text-slate-200">
              Students benefit from plans that unlock portfolio access, progress tracking, certificates, and a more complete learning experience across the platform.
            </p>
            <p className="rounded-2xl border border-white/8 bg-slate-900/55 px-5 py-4 text-sm leading-7 text-slate-200">
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
