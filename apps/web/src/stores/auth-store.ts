import { create } from 'zustand';
import type { User } from '@crm/shared';
import api from '@/lib/api';

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
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post<{
      success: boolean;
      data: { user?: User; tokens?: { accessToken: string; refreshToken: string }; requiresMfa?: boolean; tempToken?: string };
    }>('/auth/login', { email, password });
    const payload = data.data;

    if (payload.requiresMfa && payload.tempToken) {
      return { requiresMfa: true, tempToken: payload.tempToken };
    }

    const { user, tokens } = payload as { user: User; tokens: { accessToken: string; refreshToken: string } };
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
    return { requiresMfa: false };
  },

  verifyMfa: async (tempToken, code) => {
    const { data } = await api.post<{
      success: boolean;
      data: { user: User; tokens: { accessToken: string; refreshToken: string } };
    }>('/auth/verify-mfa', { tempToken, code });
    const { user, tokens } = data.data;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user, isAuthenticated: !!user });
  },

  hydrate: () => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
