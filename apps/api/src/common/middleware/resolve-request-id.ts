import { randomUUID } from 'crypto';

/** Üst sınır: ters proxy / W3C Trace bağlamı ile uyumlu, aşırı uzun başlık yükünü önler. */
export const REQUEST_ID_MAX_LENGTH = 128;

/**
 * İstemci X-Request-Id değerinde yalnızca güvenli karakterlere izin verilir (allowlist).
 * CR/LF, boşluk, kontrol karakterleri ve enjeksiyon riski taşıyan değerler reddedilir.
 *
 * @see OWASP — güvenilmeyen veriyi response header'a yansıtmadan önce doğrulama
 */
const TRUSTED_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

function isTrustedRequestId(value: string): boolean {
  return value.length <= REQUEST_ID_MAX_LENGTH && TRUSTED_REQUEST_ID.test(value);
}

/**
 * İstemciden gelen X-Request-Id başlığını güvenli hale getirir; geçersiz veya şüpheli
 * değerlerde yeni bir UUID üretir.
 */
export function resolveTrustedRequestId(
  header: string | string[] | undefined,
): string {
  if (header === undefined) {
    return randomUUID();
  }

  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== 'string') {
    return randomUUID();
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > REQUEST_ID_MAX_LENGTH) {
    return randomUUID();
  }

  if (!isTrustedRequestId(trimmed)) {
    return randomUUID();
  }

  return trimmed;
}
