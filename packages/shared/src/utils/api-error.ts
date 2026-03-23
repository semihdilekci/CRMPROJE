/**
 * Nest/Express varsayılan İngilizce mesajlarını ve Axios durum satırlarını Türkçe açıklamaya çevirir.
 */
function humanizeApiMessage(msg: string, httpStatus?: number): string {
  const t = msg.trim();
  if (/^internal server error$/i.test(t)) {
    return 'Sunucuda beklenmeyen bir hata oluştu. API (Nest) terminal çıktısını kontrol edin.';
  }
  if (/^request failed with status code \d+$/i.test(t)) {
    const code = t.match(/(\d+)\s*$/)?.[1] ?? httpStatus?.toString() ?? '?';
    return `İstek başarısız (HTTP ${code}). API adresi ve sunucu loglarını kontrol edin.`;
  }
  return msg;
}

/**
 * Axios ile gelen NestJS API hatalarından kullanıcıya gösterilecek metin üretir.
 * Ağ kesintisi, HTML hata sayfası ve message dizisi durumlarını kapsar.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as {
    response?: { status?: number; data?: unknown };
    message?: string;
    code?: string;
  };

  const status = ax.response?.status;

  if (status === 429) {
    return 'Çok fazla istek. Lütfen birkaç dakika bekleyin.';
  }

  const raw = ax.response?.data;

  if (raw && typeof raw === 'object' && raw !== null && 'message' in raw) {
    const m = (raw as { message: unknown }).message;
    if (typeof m === 'string' && m.trim()) return humanizeApiMessage(m.trim(), status);
    if (Array.isArray(m)) return m.map(String).join(', ');
  }

  if (typeof raw === 'string' && raw.length > 0 && raw.length < 400) {
    if (raw.trim().startsWith('<')) {
      return status
        ? `Sunucu hatası (${status}). API yanıtı beklenen formatta değil.`
        : fallback;
    }
    return humanizeApiMessage(raw.trim(), status);
  }

  if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
    return 'Sunucuya bağlanılamıyor. İnternet bağlantınızı ve API\'nin çalıştığını kontrol edin.';
  }

  if (typeof ax.message === 'string' && ax.message && ax.message !== 'Network Error') {
    return humanizeApiMessage(ax.message, status);
  }

  if (status && status >= 500) {
    return 'Sunucuda beklenmeyen bir hata oluştu. API konsol loglarına bakın.';
  }

  return fallback;
}
