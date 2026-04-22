import { request } from './apiClient';

export const authApi = {
  async requestRegistrationOtp(payload) {
    return request('/api/auth/register/otp/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async register(payload) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyLoginTotp(payload) {
    return request('/api/auth/login/totp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async me(token) {
    return request('/api/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateProfile(token, payload) {
    return request('/api/users/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  async deleteAccount(token) {
    return request('/api/users/me', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getTotpStatus(token) {
    return request('/api/auth/totp/status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async createTotpSetup(token) {
    return request('/api/auth/totp/setup', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async enableTotp(token, payload) {
    return request('/api/auth/totp/enable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },

  async disableTotp(token, payload) {
    return request('/api/auth/totp/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
};
