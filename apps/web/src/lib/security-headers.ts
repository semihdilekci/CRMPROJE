/**
 * Tarayıcı güvenlik başlıkları + CSP (Faz 7 sec7-05).
 *
 * Tesseract.js tarayıcıda varsayılan olarak yalnızca `cdn.jsdelivr.net` üzerinden
 * worker / tesseract.js-core / @tesseract.js-data yükler; CSP’de bu kaynak tek
 * harici whitelist olarak tanımlıdır (phase-7: minimal whitelist).
 */
const TESSERACT_CDN = 'https://cdn.jsdelivr.net';

export function getSecurityHeaders(): { key: string; value: string }[] {
  const isProd = process.env.NODE_ENV === 'production';

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    isProd
      ? `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${TESSERACT_CDN}`
      : `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' ${TESSERACT_CDN}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${TESSERACT_CDN}`,
    `worker-src 'self' blob: ${TESSERACT_CDN}`,
    "media-src 'self'",
  ];
  if (isProd) {
    cspDirectives.push('upgrade-insecure-requests');
  }
  const csp = cspDirectives.join('; ');

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
  }

  headers.push({ key: 'Content-Security-Policy', value: csp });

  return headers;
}
