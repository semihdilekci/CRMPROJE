/**
 * İstemci tarafında yalnızca `sub` vb. alanlar için; imza doğrulaması sunucuda yapılır.
 */
export function decodeJwtPayload<T extends Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(pad);
    if (typeof atob === 'undefined') return null;
    const json = atob(padded);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
