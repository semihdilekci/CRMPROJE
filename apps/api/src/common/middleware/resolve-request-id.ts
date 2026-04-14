import { randomUUID } from 'crypto';
import type { Response } from 'express';

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

/**
 * Access log korelasyonu: istemci X-Request-Id yalnızca allowlist geçerse döner; aksi halde
 * undefined (kötü amaçlı veya geçersiz değer loga yazılmaz). Yanıt başlığında kullanılmaz.
 */
export function getInboundRequestIdForLog(
  header: string | string[] | undefined,
): string | undefined {
  if (header === undefined) {
    return undefined;
  }

  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > REQUEST_ID_MAX_LENGTH) {
    return undefined;
  }

  if (!isTrustedRequestId(trimmed)) {
    return undefined;
  }

  return trimmed;
}

/**
 * Yanıt `X-Request-Id` başlığını yalnızca sunucu üretimi UUID ile yazar (Fortify Header
 * Manipulation / istemci → setHeader veri akışı yok).
 */
export function assignServerRequestIdHeader(res: Response): string {
  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);
  return requestId;
}
