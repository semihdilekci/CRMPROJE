import { create } from 'zustand';
import type { ApiSuccessResponse, User } from '@crm/shared';
import api from '@/lib/api';
import { getAccessToken, setAccessToken } from '@/lib/access-token';
import { decodeJwtPayload } from '@/lib/decode-jwt-payload';

export type LoginResult =
  | { requiresMfa: false }
  | { requiresMfa: true; tempToken: string };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyMfa: (tempToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post<{
      success: boolean;
      data: { user?: User; tokens?: { accessToken: string }; requiresMfa?: boolean; tempToken?: string };
    }>('/auth/login', { email, password });
    const payload = data.data;

    if (payload.requiresMfa && payload.tempToken) {
      return { requiresMfa: true, tempToken: payload.tempToken };
    }

    const { user, tokens } = payload as { user: User; tokens: { accessToken: string } };
    setAccessToken(tokens.accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
    return { requiresMfa: false };
  },

  verifyMfa: async (tempToken, code) => {
    const { data } = await api.post<{
      success: boolean;
      data: { user: User; tokens: { accessToken: string } };
    }>('/auth/verify-mfa', { tempToken, code });
    const { user, tokens } = data.data;
    setAccessToken(tokens.accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  hydrate: async () => {
    /** SPA’de az önce giriş yapıldıysa access zaten bellekte; refresh çağrısı çerez/proxy gecikmesinde başarısız olup oturumu silmesin. */
    const existingToken = getAccessToken();
    const existingUser = get().user;
    if (existingToken && existingUser && get().isAuthenticated) {
      set({ isLoading: false });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({ isLoading: true });
    try {
      const { data } = await api.post<ApiSuccessResponse<{ accessToken: string }>>('/auth/refresh', {});
      if (!data.success || !data.data?.accessToken) {
        throw new Error('refresh failed');
      }
      const accessToken = data.data.accessToken;
      setAccessToken(accessToken);
      const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
      const sub = payload?.sub;
      if (!sub) {
        throw new Error('no sub');
      }
      const { data: userRes } = await api.get<ApiSuccessResponse<User>>(`/users/${sub}`);
      if (!userRes.success || !userRes.data) {
        throw new Error('user fetch failed');
      }
      set({ user: userRes.data, isAuthenticated: true, isLoading: false });
    } catch {
      const tokenAfter = getAccessToken();
      const userAfter = get().user;
      if (tokenAfter && userAfter) {
        set({ isAuthenticated: true, isLoading: false });
        return;
      }
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
