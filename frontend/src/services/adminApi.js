import { request } from './apiClient';

export const adminApi = {
  async listUsers(token) {
    return request('/api/admin/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateUserRole(token, userId, role) {
    return request(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
  },
};

