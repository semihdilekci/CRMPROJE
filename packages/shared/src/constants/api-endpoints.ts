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
    NOTES: (id: string) => `/opportunities/${id}/notes`,
    NOTE_BY_ID: (oppId: string, noteId: string) =>
      `/opportunities/${oppId}/notes/${noteId}`,
  },
  UPLOAD: {
    CARD_IMAGE: '/upload/card-image',
    CARD_IMAGE_OCR: '/upload/card-image-ocr',
  },
  REPORTS: {
    EXECUTIVE_SUMMARY: '/reports/executive-summary',
    FAIR_PERFORMANCE: '/reports/fair-performance',
    FAIR_COMPARISON: '/reports/fair-comparison',
    FAIR_TARGETS: '/reports/fair-targets',
    PIPELINE_OVERVIEW: '/reports/pipeline-overview',
    PIPELINE_VELOCITY: '/reports/pipeline-velocity',
    WIN_LOSS: '/reports/win-loss',
    REVENUE: '/reports/revenue',
    FORECAST: '/reports/forecast',
    CUSTOMER_OVERVIEW: '/reports/customer-overview',
    CUSTOMER_SEGMENTATION: '/reports/customer-segmentation',
    CUSTOMER_LIFECYCLE: '/reports/customer-lifecycle',
    PRODUCT_ANALYSIS: '/reports/product-analysis',
    PRODUCT_FAIR_MATRIX: '/reports/product-fair-matrix',
    TEAM_PERFORMANCE: '/reports/team-performance',
    INDIVIDUAL_PERFORMANCE: '/reports/individual-performance',
    ACTIVITY_ANALYSIS: '/reports/activity-analysis',
  },
} as const;
