import { request } from './apiClient';

export const paymentApi = {
  async initialize(token, plan) {
    return request('/api/payments/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });
  },

  async verify(token, reference) {
    return request(`/api/payments/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
