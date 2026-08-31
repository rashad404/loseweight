import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8044/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lw_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('lw_token');
      window.dispatchEvent(new Event('lw:auth-changed'));
    }
    return Promise.reject(error);
  },
);
