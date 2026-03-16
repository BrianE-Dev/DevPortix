import { request } from './apiClient';

export const authApi = {
  async requestRegistrationOtp(email) {
    return request('/api/mailer/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose: 'registration' }),
    });
  },

  async verifyRegistrationOtp(email, otp) {
    return request('/api/mailer/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose: 'registration' }),
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
};
