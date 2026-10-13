import axios from 'axios';

// Production: VITE_API_URL = https://your-api.onrender.com (set on Vercel)
// Development: unset — the Vite proxy handles /api and /uploads
export const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('portal_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && location.pathname !== '/login') {
      localStorage.removeItem('portal_token');
      location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e?.response?.data?.message || 'Something went wrong';