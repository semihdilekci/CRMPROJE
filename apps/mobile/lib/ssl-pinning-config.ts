/**
 * Saf TLS public key pin listesi (iOS TrustKit en az 2 pin ister).
 * @see docs/phase-7-security-hardening.md §12
 */
export const MIN_PUBLIC_KEY_PINS = 2;

/**
 * EXPO_PUBLIC_SSL_PUBLIC_KEY_HASHES — virgülle ayrılmış base64 SHA-256 SPKI hash'leri.
 */
export function parsePublicKeyHashesFromEnv(raw: string | undefined): string[] {
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function getHostnameForPinning(apiBaseUrl: string): string | null {
  try {
    const u = new URL(apiBaseUrl);
    if (u.protocol !== 'https:') {
      return null;
    }
    const host = u.hostname;
    return host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

export type ShouldPinResult =
  | { ok: true; hostname: string }
  | { ok: false; reason: string };

/**
 * Pinning yalnızca açıkça açıldığında ve HTTPS + yeterli pin ile etkinleşir (yanlışlıkla dev kilidini önler).
 */
export function evaluateSslPinningPrereqs(options: {
  enableFlag: string | undefined;
  apiBaseUrl: string;
  hashes: string[];
}): ShouldPinResult {
  if (options.enableFlag !== 'true') {
    return { ok: false, reason: 'EXPO_PUBLIC_ENABLE_SSL_PINNING true değil' };
  }
  if (!options.apiBaseUrl.startsWith('https://')) {
    return { ok: false, reason: 'API tabanı HTTPS değil (DEV HTTP veya yanlış URL)' };
  }
  if (options.hashes.length < MIN_PUBLIC_KEY_PINS) {
    return {
      ok: false,
      reason: `En az ${MIN_PUBLIC_KEY_PINS} public key hash gerekli (iOS TrustKit)`,
    };
  }
  const hostname = getHostnameForPinning(options.apiBaseUrl);
  if (!hostname) {
    return { ok: false, reason: 'API URL hostname çıkarılamadı' };
  }
  return { ok: true, hostname };
}
