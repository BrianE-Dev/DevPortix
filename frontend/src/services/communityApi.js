import { request } from './apiClient';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const getGuestId = () => {
  if (typeof window === 'undefined') return '';

  const storageKey = 'devportix_guest_id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const nextId =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(storageKey, nextId);
  return nextId;
};

const communityHeaders = (token) => ({
  ...(token ? authHeaders(token) : {}),
  'X-Guest-Id': getGuestId(),
});

const toFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    formData.append(key, String(value));
  });

  return formData;
};

export const communityApi = {
  async listUsers(token, params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return request(`/api/community/users${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async listFriendRequests(token) {
    return request('/api/community/friends/requests', {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async sendFriendRequest(token, userId) {
    return request(`/api/community/friends/requests/${userId}`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  },

  async respondToFriendRequest(token, requestId, action) {
    return request(`/api/community/friends/requests/${requestId}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ action }),
    });
  },

  async cancelFriendRequest(token, requestId) {
    return request(`/api/community/friends/requests/${requestId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  async listFriendMessages(token, friendId) {
    return request(`/api/community/friends/messages/${friendId}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async sendFriendMessage(token, friendId, payload) {
    return request(`/api/community/friends/messages/${friendId}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  async listPosts(token, params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return request(`/api/community/posts${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: communityHeaders(token),
    });
  },

  async createPost(token, payload) {
    return request('/api/community/posts', {
      method: 'POST',
      headers: authHeaders(token),
      body: payload?.media ? toFormData(payload) : JSON.stringify(payload),
    });
  },

  async updatePost(token, id, payload) {
    return request(`/api/community/posts/${id}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: payload?.media ? toFormData(payload) : JSON.stringify(payload),
    });
  },

  async removePost(token, id) {
    return request(`/api/community/posts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  async listComments(token, postId) {
    return request(`/api/community/posts/${postId}/comments`, {
      method: 'GET',
      headers: communityHeaders(token),
    });
  },

  async createComment(token, postId, payload) {
    return request(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  async updateComment(token, postId, commentId, payload) {
    return request(`/api/community/posts/${postId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  async removeComment(token, postId, commentId) {
    return request(`/api/community/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  async toggleLike(token, postId) {
    return request(`/api/community/posts/${postId}/upvotes/toggle`, {
      method: 'POST',
      headers: communityHeaders(token),
    });
  },
};
