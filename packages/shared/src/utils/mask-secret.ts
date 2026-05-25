/**
 * Secret değerini admin UI için maskeler: ilk 4 + son 4 karakter görünür.
 * 8 karakter ve altı tamamen gizlenir.
 */
export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) {
    return '****';
  }
  const hiddenLen = Math.min(12, trimmed.length - 8);
  return `${trimmed.slice(0, 4)}${'*'.repeat(hiddenLen)}${trimmed.slice(-4)}`;
}
