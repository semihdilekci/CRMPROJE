/** Access JWT yalnızca bellekte tutulur (localStorage yok). */
let accessToken: string | null = null;
let _onNewTokenCallback: ((token: string) => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) _onNewTokenCallback?.(token);
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Yeni bir access token set edildiğinde tetiklenir.
 * auth-store bu callback'i kayıt eder; api.ts döngüsel bağımlılık olmadan
 * sadece setAccessToken çağırır.
 */
export function onNewAccessToken(cb: (token: string) => void): void {
  _onNewTokenCallback = cb;
}
