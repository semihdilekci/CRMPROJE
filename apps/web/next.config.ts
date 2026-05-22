import path from 'node:path';
import type { NextConfig } from 'next';

/** DEV-only rewrite hedefi; API PORT ile uyumlu olmalı (apps/api/.env). IPv6 localhost kaçınmak için 127.0.0.1. */
const devApiPort = process.env.API_PORT || process.env.PORT || '3002';
const devApiOrigin =
  process.env.INTERNAL_API_URL?.replace(/\/$/, '') || `http://127.0.0.1:${devApiPort}`;

const nextConfig: NextConfig = {
  /** Docker runner: yalnızca izlenen dosyalar + server.js (bkz. apps/web/Dockerfile). */
  output: 'standalone',
  /** Monorepo: @crm/shared ve kök node_modules iz sürmesi için repo kökü. */
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@crm/shared'],
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      { source: '/api/v1/:path*', destination: `${devApiOrigin}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${devApiOrigin}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
