/**
 * CORS origin listesi — Faz 7: credentials ile çerez kullanımında wildcard kullanılmaz.
 * Production: CORS_ORIGIN zorunlu (virgülle ayrılmış tam origin'ler).
 * Development: CORS_ORIGIN yoksa web + Expo varsayılanları; fiziksel cihaz/LAN için .env'e origin ekleyin.
 */
const DEV_DEFAULT_ORIGINS: readonly string[] = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGIN must be set in production (comma-separated full origins; no wildcard).',
    );
  }
  return [...DEV_DEFAULT_ORIGINS];
}
