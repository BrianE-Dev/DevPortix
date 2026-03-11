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
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {visiblePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-b ${plan.color}/20 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                plan.popular ? 'border-blue-500/50 hover:border-blue-400/70' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-sm font-medium">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 ml-2">{plan.period}</span>}
                </div>
                <p className="text-gray-400">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handlePlanCheckout(plan.id)}
                disabled={activePlanId === plan.id || activePlanId === 'verify'}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {activePlanId === plan.id
                  ? 'Redirecting...'
                  : plan.id === resolvedPlan
                    ? 'Current Plan'
                    : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
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
