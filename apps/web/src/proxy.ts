import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSecurityHeaders } from '@/lib/security-headers';

/**
 * Güvenlik başlıklarını sayfa isteklerinde uygular (HTML ve RSC).
 * `/api/v1` proxy istekleri hariç — rewrite ile API'ye giden JSON akışını etkilemez.
 */
export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  for (const { key, value } of getSecurityHeaders()) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|api/v1).*)',
  ],
};
