import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data.data),
  profile: () => api.get('/auth/profile').then((r) => r.data.data),
};

export const appsApi = {
  list: () => api.get('/apps').then((r) => r.data.data),
  create: (data: { playStoreLink?: string; appStoreLink?: string }) =>
    api.post('/apps', data).then((r) => r.data.data),
  get: (id: string) => api.get(`/apps/${id}`).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/apps/${id}`).then((r) => r.data.data),
  scrapePreview: (data: { playStoreLink?: string; appStoreLink?: string }) =>
    api.post('/apps/scrape-preview', data).then((r) => r.data.data),
};

export const reviewsApi = {
  getFetchStatus: (appId: string) =>
    api.get(`/apps/${appId}/fetch-reviews`).then((r) => r.data.data),
  confirmFetch: (appId: string, options?: { limit?: number; startDate?: string; endDate?: string }) =>
    api.post(`/apps/${appId}/fetch-reviews/confirm`, options).then((r) => r.data.data),
  deleteAll: (appId: string) =>
    api.delete(`/apps/${appId}/reviews`).then((r) => r.data.data),
  list: (appId: string, params?: {
    page?: number; limit?: number; rating?: number; platform?: string; search?: string;
    startDate?: string; endDate?: string;
  }) => api.get(`/apps/${appId}/reviews`, { params }).then((r) => r.data.data),
};

export const analysisApi = {
  queue: (appId: string) =>
    api.post(`/apps/${appId}/analyse`).then((r) => r.data.data),
  list: (appId: string) =>
    api.get(`/apps/${appId}/analyses`).then((r) => r.data.data),
  latest: (appId: string) =>
    api.get(`/apps/${appId}/analyses/latest`).then((r) => r.data.data),
};

export const competitorApi = {
  add: (appId: string, data: { playStoreLink?: string; appStoreLink?: string; competitorAppName: string }) =>
    api.post(`/apps/${appId}/competitor`, data).then((r) => r.data.data),
  getAnalysis: (appId: string) =>
    api.get(`/apps/${appId}/competitor-analysis`).then((r) => r.data.data),
};

export const jobsApi = {
  get: (id: string) => api.get(`/jobs/${id}`).then((r) => r.data.data),
};

export const exportApi = {
  exportPdf: (appId: string) =>
    api.get(`/apps/${appId}/analyses/latest/export-pdf`, { responseType: 'blob' }),
  exportReviewsPdf: (appId: string) =>
    api.get(`/apps/${appId}/reviews/export-pdf`, { responseType: 'blob' }),
};

export default api;
