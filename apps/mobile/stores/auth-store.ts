import { create } from 'zustand';
import type { User } from '@crm/shared';
import api from '@/lib/api';
import * as storage from '@/lib/storage';

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
  forceLogout: () => void;
  setUser: (user: User | null) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post<{
      success: boolean;
      data: {
        user?: User;
        tokens?: { accessToken: string; refreshToken: string };
        requiresMfa?: boolean;
        tempToken?: string;
      };
    }>('/auth/login', { email, password });
    const payload = data.data;

    if (payload.requiresMfa && payload.tempToken) {
      return { requiresMfa: true, tempToken: payload.tempToken };
    }

    const { user, tokens } = payload as {
      user: User;
      tokens: { accessToken: string; refreshToken: string };
    };
    await storage.setAccessToken(tokens.accessToken);
    await storage.setRefreshToken(tokens.refreshToken);
    await storage.setUser(JSON.stringify(user));
    set({ user, isAuthenticated: true });
    return { requiresMfa: false };
  },

  verifyMfa: async (tempToken, code) => {
    const { data } = await api.post<{
      success: boolean;
      data: { user: User; tokens: { accessToken: string; refreshToken: string } };
    }>('/auth/verify-mfa', { tempToken, code });
    const { user, tokens } = data.data;
    await storage.setAccessToken(tokens.accessToken);
    await storage.setRefreshToken(tokens.refreshToken);
    await storage.setUser(JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await storage.clearAuth();
      set({ user: null, isAuthenticated: false });
    }
  },

  forceLogout: () => {
    set({ user: null, isAuthenticated: false });
  },

  setUser: async (user) => {
    if (user) {
      await storage.setUser(JSON.stringify(user));
    } else {
      await storage.clearAuth();
    }
    set({ user, isAuthenticated: !!user });
  },

  hydrate: async () => {
    const token = await storage.getAccessToken();
    const storedUser = await storage.getUser();

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        await storage.clearAuth();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
