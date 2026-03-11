import { request } from './apiClient';

export const portfolioApi = {
  async getMine(token) {
    return request('/api/portfolios/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async createMine(token) {
    return request('/api/portfolios/me', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateMine(token, payload) {
    return request('/api/portfolios/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  async getShareAssets(token) {
    return request('/api/portfolios/me/share', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getPublic(slug) {
    return request(`/api/portfolios/public/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });
  },
};
