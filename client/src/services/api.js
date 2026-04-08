import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://office-git-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('officegit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('officegit_token');
      localStorage.removeItem('officegit_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Documents ───
export const documentAPI = {
  create: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createText: (data) => api.post('/documents', data),
  list: (page = 1, limit = 20) => api.get(`/documents?page=${page}&limit=${limit}`),
  get: (id) => api.get(`/documents/${id}`),
  updateAccess: (id, data) => api.patch(`/documents/${id}/access`, data),
};

// ─── Versions ───
export const versionAPI = {
  create: (documentId, data) => api.post(`/documents/${documentId}/versions`, data),
  list: (documentId, page = 1, limit = 20) =>
    api.get(`/documents/${documentId}/versions?page=${page}&limit=${limit}`),
  get: (versionId) => api.get(`/versions/${versionId}`),
  rollback: (versionId) => api.post(`/versions/${versionId}/rollback`),
  approve: (versionId) => api.post(`/versions/${versionId}/approve`),
};

// ─── Diff ───
export const diffAPI = {
  compare: (v1, v2) => api.get(`/diff?v1=${v1}&v2=${v2}`),
};

// ─── Audit ───
export const auditAPI = {
  getLog: (documentId, page = 1, limit = 50) =>
    api.get(`/documents/${documentId}/audit?page=${page}&limit=${limit}`),
};

export default api;
