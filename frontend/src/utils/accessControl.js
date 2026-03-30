import { ROLES } from './constants';

const PAID_PLAN_REQUIRED_ROLES = new Set([ROLES.ORGANIZATION, ROLES.PROFESSIONAL]);
const PAID_PLANS = new Set(['basic', 'standard', 'premium', 'pro']);

export const normalizeRole = (role) => String(role || '').trim().toLowerCase();
export const normalizeSubscription = (subscription) => String(subscription || 'free').trim().toLowerCase();

export const roleRequiresPaidPlan = (role) => PAID_PLAN_REQUIRED_ROLES.has(normalizeRole(role));

export const userHasPaidPlan = (user) => PAID_PLANS.has(normalizeSubscription(user?.subscription));

export const requiresPlanPurchase = (user) =>
  roleRequiresPaidPlan(user?.role) && !userHasPaidPlan(user);

export const getRecommendedPlanForRole = (role) =>
  normalizeRole(role) === ROLES.PROFESSIONAL ? 'premium' : 'basic';
