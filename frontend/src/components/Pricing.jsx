// src/components/Pricing.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PRICING_PLANS } from '../data/pricingPlans';
import LocalStorageService from '../services/localStorageService';
import { paymentApi } from '../services/paymentApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';

const Pricing = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activePlanId, setActivePlanId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const currentPlan = useMemo(() => String(user?.subscription || 'free').toLowerCase(), [user?.subscription]);
  const isOrganization = user?.role === ROLES.ORGANIZATION;
  const visiblePlans = useMemo(
    () => (isOrganization ? PRICING_PLANS.filter((plan) => plan.id !== 'free') : PRICING_PLANS),
    [isOrganization]
  );
  const callbackReference = searchParams.get('reference') || searchParams.get('trxref');
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
        LocalStorageService.setUser(response.user);
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
  }, [callbackReference, currentPlan, isAuthenticated, navigate]);

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
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                  ? 'text-violet-300'
                  : plan.id === 'standard'
                    ? 'text-cyan-400'
                    : 'text-orange-400';
              const buttonClass = isPopular
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_14px_30px_rgba(139,92,246,0.35)] hover:opacity-95'
                : plan.id === 'standard'
                  ? 'border border-cyan-500/60 bg-transparent text-cyan-400 hover:bg-cyan-500/10'
                  : plan.id === 'premium'
                    ? 'bg-orange-500 text-white hover:bg-orange-400'
                    : 'border border-white/10 bg-white/8 text-white hover:bg-white/12';
              const iconClass = plan.id === 'premium' ? 'text-orange-400' : 'text-emerald-400';

              return (
            <div
              key={plan.id}
              className={`relative rounded-[22px] border p-7 transition-all duration-300 hover:-translate-y-1 ${cardClass}`}
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
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="mb-1 text-slate-500">{plan.period}</span>}
                </div>
                <p className="max-w-xs text-sm leading-6 text-slate-500">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className={`mt-1 mr-3 h-4 w-4 flex-shrink-0 ${iconClass}`} />
                    <span className="text-slate-300">{feature}</span>
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
          <p className="text-slate-500 italic">
            {isOrganization
              ? 'Organization accounts start from Basic and can upgrade anytime.'
              : 'Start free and upgrade anytime as your student base grows.'}
          </p>
          {notice && <p className="text-green-300 mt-3">{notice}</p>}
          {error && <p className="text-red-300 mt-3">{error}</p>}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
