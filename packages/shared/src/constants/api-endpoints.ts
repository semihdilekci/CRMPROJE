export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  FAIRS: {
    BASE: '/fairs',
    BY_ID: (id: string) => `/fairs/${id}`,
    OPPORTUNITIES: (fairId: string) => `/fairs/${fairId}/opportunities`,
  },
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
  },
  OPPORTUNITIES: {
    BY_ID: (id: string) => `/opportunities/${id}`,
  },
  UPLOAD: {
    CARD_IMAGE: '/upload/card-image',
  },
} as const;
