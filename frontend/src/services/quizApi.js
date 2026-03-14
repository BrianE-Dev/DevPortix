import { request } from './apiClient';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const quizApi = {
  async getTracks(token) {
    return request('/api/quizzes/tracks', {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async getQuestions(token, track) {
    return request(`/api/quizzes/questions/${encodeURIComponent(track)}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async submit(token, track, answers) {
    return request(`/api/quizzes/submit/${encodeURIComponent(track)}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ answers }),
    });
  },

  async getScore(token, track) {
    return request(`/api/quizzes/score/${encodeURIComponent(track)}`, {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async getCertificate(token, track, format = 'png') {
    return request(
      `/api/quizzes/certificate/${encodeURIComponent(track)}?format=${encodeURIComponent(format)}`,
      {
      method: 'GET',
      headers: authHeaders(token),
      }
    );
  },
};
