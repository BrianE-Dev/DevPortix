import { request } from './apiClient';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const toFormData = (payload = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
};

export const mentorshipApi = {
  async listInstructors(token) {
    return request('/api/mentorship/instructors', {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async selectInstructor(token, instructorId) {
    return request('/api/mentorship/select-instructor', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ instructorId }),
    });
  },

  async getMyMentorship(token) {
    return request('/api/mentorship/my-mentorship', {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async listMyStudents(token) {
    return request('/api/mentorship/my-students', {
      method: 'GET',
      headers: authHeaders(token),
    });
  },

  async addMyStudent(token, studentEmail) {
    return request('/api/mentorship/my-students', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ studentEmail }),
    });
  },

  async removeMyStudent(token, studentId) {
    return request(`/api/mentorship/my-students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  async createAssignment(token, studentId, payload) {
    const hasFile = payload?.attachment instanceof File;
    return request(`/api/mentorship/my-students/${encodeURIComponent(studentId)}/assignments`, {
      method: 'POST',
      headers: authHeaders(token),
      body: hasFile ? toFormData(payload) : JSON.stringify(payload),
    });
  },

  async createAssignments(token, payload) {
    const hasFile = payload?.attachment instanceof File;
    return request('/api/mentorship/assignments', {
      method: 'POST',
      headers: authHeaders(token),
      body: hasFile ? toFormData(payload) : JSON.stringify(payload),
    });
  },

  async updateAssignment(token, assignmentId, payload) {
    const hasFile = payload?.attachment instanceof File;
    return request(`/api/mentorship/assignments/${encodeURIComponent(assignmentId)}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: hasFile ? toFormData(payload) : JSON.stringify(payload),
    });
  },

  async deleteAssignment(token, assignmentId) {
    return request(`/api/mentorship/assignments/${encodeURIComponent(assignmentId)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  },

  async submitMyAssignment(token, assignmentId, payload) {
    const hasFile = payload?.submissionAttachment instanceof File;
    return request(`/api/mentorship/my-assignments/${encodeURIComponent(assignmentId)}/submit`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: hasFile ? toFormData(payload) : JSON.stringify(payload),
    });
  },
};
