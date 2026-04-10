import type { NextConfig } from 'next';

/** DEV-only rewrite hedefi; Docker içinde `next dev` için örn. http://api:3001 */
const devApiOrigin =
  process.env.INTERNAL_API_URL?.replace(/\/$/, '') || 'http://localhost:3002';

const nextConfig: NextConfig = {
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
