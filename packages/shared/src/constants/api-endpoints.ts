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
    CUSTOMERS: (fairId: string) => `/fairs/${fairId}/customers`,
  },
  CUSTOMERS: {
    BY_ID: (id: string) => `/customers/${id}`,
  },
  UPLOAD: {
    CARD_IMAGE: '/upload/card-image',
  },
} as const;
