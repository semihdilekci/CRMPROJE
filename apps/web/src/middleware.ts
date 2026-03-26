import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSecurityHeaders } from '@/lib/security-headers';

/**
 * Güvenlik başlıklarını her istekte uygular (HTML ve RSC dahil).
 * `next.config` headers bazı ortamlarda atlanabildiği için middleware ile tekrarlanır.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  for (const { key, value } of getSecurityHeaders()) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    /*
     * _next/static ve image optimizer yanıtlarına başlık eklemek gereksiz;
     * sayfa ve veri istekleri güvenlik başlıklarını taşır.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
