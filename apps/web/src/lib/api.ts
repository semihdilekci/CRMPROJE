'use client';

import axios from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/access-token';

/** Tarayıcıda proxy kullan (CORS önlenir). Sunucu tarafında env veya localhost. */
const getBaseURL = () => {
  if (typeof window !== 'undefined') return '/api/v1';
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  return envUrl || 'http://localhost:3002/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/verify-mfa');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post<{ success: boolean; data: { accessToken: string } }>(
          '/auth/refresh',
          {}
        );

        const newAccessToken = data.data.accessToken;
        setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
