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
  const fromEnv = raw ? raw.split(',').map((o) => o.trim()).filter(Boolean) : [];

  if (process.env.NODE_ENV === 'production') {
    if (!fromEnv.length) {
      throw new Error(
        'CORS_ORIGIN must be set in production (comma-separated full origins; no wildcard).',
      );
    }
    return fromEnv;
  }

  return [...new Set([...DEV_DEFAULT_ORIGINS, ...fromEnv])];
}

/** DEV: LAN IP ile web paneli (örn. http://192.168.1.7:3000) doğrudan API çağrısı için. */
export function isDevPrivateWebOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (u.port && u.port !== '3000') return false;
    const host = u.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
    );
  } catch {
    return false;
  }
}

type CorsOriginCallback = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

export function resolveCorsOrigin(): string[] | CorsOriginCallback {
  if (process.env.NODE_ENV === 'production') {
    return getCorsOrigins();
  }

  const allowed = new Set(getCorsOrigins());
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowed.has(origin) || isDevPrivateWebOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  };
}
