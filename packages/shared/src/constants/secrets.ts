/** Veritabanında şifreli saklanan sistem secret anahtarları */
export const SYSTEM_SECRET_KEYS = {
  GEMINI_API_KEY: 'GEMINI_API_KEY',
} as const;

export type SystemSecretKey = (typeof SYSTEM_SECRET_KEYS)[keyof typeof SYSTEM_SECRET_KEYS];
