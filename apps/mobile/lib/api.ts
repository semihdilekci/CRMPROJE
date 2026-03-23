import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAuth } from './storage';

let onAuthError: (() => void) | null = null;

/** 401 refresh başarısız olduğunda çağrılacak handler (app init'te ayarlanır) */
export function setAuthErrorHandler(handler: () => void): void {
  onAuthError = handler;
}

/**
 * Mobil API taban adresi.
 * - `EXPO_PUBLIC_API_URL` (apps/mobile/.env) tanımlıysa her ortamda önceliklidir (LAN IP).
 * - Android emülatörü: localhost/127 ile eşleşen env yoksa `10.0.2.2` kullanılır.
 * - iOS Simülatör: env yoksa `127.0.0.1` (Mac’teki API).
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  const fromEnv = typeof raw === 'string' && raw.length > 0 ? raw.trim() : '';
  const isAndroidEmulator = __DEV__ && Platform.OS === 'android' && !Constants.isDevice;
  const isIosSimulator = __DEV__ && Platform.OS === 'ios' && !Constants.isDevice;

  if (isAndroidEmulator) {
    const envPointsToDevMachine =
      !fromEnv || /localhost|127\.0\.0\.1/i.test(fromEnv);
    if (envPointsToDevMachine) {
      return 'http://10.0.2.2:3001/api/v1';
    }
    return fromEnv;
  }

  if (fromEnv) {
    return fromEnv;
  }

  if (isIosSimulator) {
    return 'http://127.0.0.1:3001/api/v1';
  }

  if (__DEV__ && Constants.isDevice) {
    console.warn(
      '[CRM Mobile] Fiziksel cihaz: API adresi bu makineyi göstermiyor. apps/mobile/.env içinde EXPO_PUBLIC_API_URL=http://<bilgisayar-LAN-IP>:3001/api/v1 tanımlayın (telefon ve bilgisayar aynı Wi‑Fi’de olmalı).',
    );
  }

  return 'http://127.0.0.1:3001/api/v1';
}

const getBaseURL = () => getApiBaseUrl();

/** Upload/card-image gibi asset URL'leri için base (api/v1 olmadan) */
export function getAssetBaseUrl(): string {
  const url = getBaseURL();
  return url.replace(/\/api\/v1\/?$/, '') || url;
}

const REQUEST_TIMEOUT_MS = 25_000;

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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

        const { data } = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          { refreshToken },
          { timeout: REQUEST_TIMEOUT_MS },
        );

        const newAccessToken = data.data.accessToken as string;
        const newRefreshToken = data.data.refreshToken as string;

        await setAccessToken(newAccessToken);
        await setRefreshToken(newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        await clearAuth();
        onAuthError?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
