import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAuth } from './storage';

const getBaseURL = () => {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  return url || 'http://localhost:3001/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${getBaseURL()}/auth/refresh`, { refreshToken });

        const newAccessToken = data.data.accessToken as string;
        const newRefreshToken = data.data.refreshToken as string;

        await setAccessToken(newAccessToken);
        await setRefreshToken(newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        await clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
