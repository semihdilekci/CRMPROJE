/**
 * Tarayıcı güvenlik başlıkları + CSP (Faz 7 sec7-05).
 *
 * Tesseract.js tarayıcıda varsayılan olarak yalnızca `cdn.jsdelivr.net` üzerinden
 * worker / tesseract.js-core / @tesseract.js-data yükler; CSP’de bu kaynak tek
 * harici whitelist olarak tanımlıdır (phase-7: minimal whitelist).
 */
const TESSERACT_CDN = 'https://cdn.jsdelivr.net';

/**
 * NEXT_PUBLIC_API_URL farklı bir origin'e işaret ediyorsa (örn. Docker'da
 * web :3000, API :3002) CSP connect-src'ye eklenmeli; aksi halde tarayıcı
 * cross-origin API çağrılarını engeller.
 */
function getApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || '';
  if (!raw) return '';
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return '';
  }
}

export function getSecurityHeaders(): { key: string; value: string }[] {
  const isProd = process.env.NODE_ENV === 'production';

  const headers: { key: string; value: string }[] = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value:
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    },
  ];

  if (isProd) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    });

    /**
     * CSP yalnızca üretimde: `next dev` / Turbopack HMR, WebSocket ve
     * localhost ↔ 127.0.0.1 origin farkı sıkı CSP ile çakışıp beyaz ekrana yol açabiliyor.
     */
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${TESSERACT_CDN}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self' ${TESSERACT_CDN}${getApiOrigin() ? ' ' + getApiOrigin() : ''}`,
      `worker-src 'self' blob: ${TESSERACT_CDN}`,
      "media-src 'self'",
      'upgrade-insecure-requests',
    ];
    headers.push({
      key: 'Content-Security-Policy',
      value: cspDirectives.join('; '),
    });
  }

  return headers;
}
