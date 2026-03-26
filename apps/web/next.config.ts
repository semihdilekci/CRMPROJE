import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Sıkı CSP: harici script/domain yok; yalnızca same-origin.
 * Next.js üretim paketleri ve Tesseract (WASM/worker) için gerekli istisnalar: unsafe-inline, wasm-unsafe-eval, blob worker.
 */
function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    isProd
      ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "media-src 'self'",
  ];
  if (isProd) {
    directives.push('upgrade-insecure-requests');
  }
  return directives.join('; ');
}

const securityHeaders: { key: string; value: string }[] = [
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
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  });
}

securityHeaders.push({
  key: 'Content-Security-Policy',
  value: buildContentSecurityPolicy(),
});

const nextConfig: NextConfig = {
  transpilePackages: ['@crm/shared'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      { source: '/api/v1/:path*', destination: 'http://localhost:3002/api/v1/:path*' },
      { source: '/uploads/:path*', destination: 'http://localhost:3002/uploads/:path*' },
    ];
  },
};

export default nextConfig;
