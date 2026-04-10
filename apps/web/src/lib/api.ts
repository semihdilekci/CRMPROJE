'use client';

import axios from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/access-token';

/**
 * DEV (next dev): tarayıcı `/api/v1` → next.config rewrites ile API'ye gider (CORS yok).
 * PROD (next start / Docker): rewrite yok; tarayıcı doğrudan NEXT_PUBLIC_API_URL kullanmalı.
 */
function getBaseURL(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || '';

  if (typeof window === 'undefined') {
    return envUrl || 'http://localhost:3002/api/v1';
  }

  if (process.env.NODE_ENV === 'production') {
    return envUrl || 'http://localhost:3001/api/v1';
  }

  return '/api/v1';
}

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
    const status = error.response?.status as number | undefined;
    if (status === 429 && typeof window !== 'undefined') {
      const data = error.response?.data as { message?: string } | undefined;
      const fallback = 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.';
      if (data && typeof data === 'object' && !data.message) {
        error.response.data = { ...data, message: fallback };
      }
    }

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
