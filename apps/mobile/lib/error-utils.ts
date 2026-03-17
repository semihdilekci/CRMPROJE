/** API hata yanıtından mesaj çıkarır (blob veya JSON) */
export async function extractApiErrorMessage(err: unknown): Promise<string | null> {
  if (!err || typeof err !== 'object') return null;
  const axiosErr = err as {
    message?: string;
    response?: { data?: unknown; status?: number };
  };
  if (axiosErr.message && !axiosErr.response) {
    return axiosErr.message;
  }
  const res = axiosErr.response;
  if (!res) return null;

  const extractFromObj = (obj: Record<string, unknown>): string | null => {
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.msg === 'string') return obj.msg;
    if (Array.isArray(obj.details) && obj.details.length > 0) {
      const first = obj.details[0];
      if (first && typeof first === 'object' && 'message' in first) {
        return String((first as { message: unknown }).message);
      }
    }
    return null;
  };

  const isBlob = res.data instanceof Blob || (res.data && typeof res.data === 'object' && typeof (res.data as { text?: () => Promise<string> }).text === 'function');
  if (isBlob && res.data) {
    try {
      const blob = res.data as Blob;
      const text = await blob.text();
      if (!text?.trim()) {
        return res.status ? `Hata (${res.status})` : null;
      }
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        return extractFromObj(parsed) ?? (res.status ? `Hata (${res.status})` : null);
      } catch {
        return text.length > 0 ? text.slice(0, 200) : (res.status ? `Hata (${res.status})` : null);
      }
    } catch {
      return res.status ? `Hata (${res.status})` : null;
    }
  }

  if (res.data && typeof res.data === 'object') {
    return extractFromObj(res.data as Record<string, unknown>);
  }
  return res.status ? `Hata (${res.status})` : null;
}
