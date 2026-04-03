import { z } from 'zod';

/** SystemSetting anahtarı — arka plan blob JSON değeri */
export const AMBIENT_BLOB_CONFIG_KEY = 'WEB_AMBIENT_BLOB_CONFIG' as const;

export const ambientBlobConfigSchema = z.object({
  /** 3–10 arası blob sayısı */
  blobCount: z.number().int().min(3).max(10),
  /** Hareket hızı çarpanı: yüksek = daha hızlı (segment süreleri kısalır) */
  speed: z.number().min(0.25).max(2.5),
  /** Taban boyut çarpanı (vmin ölçeği) */
  size: z.number().min(0.45).max(1.35),
  /** Nabız genliği: 0 = sabit çap, üst sınır ≈ ±%35 ölçek salınımı */
  pulseAmount: z.number().min(0).max(0.35),
});

export type AmbientBlobConfig = z.infer<typeof ambientBlobConfigSchema>;

export const DEFAULT_AMBIENT_BLOB_CONFIG: AmbientBlobConfig = {
  blobCount: 3,
  speed: 1,
  size: 1,
  pulseAmount: 0.12,
};

export function parseAmbientBlobConfigJson(raw: string | null | undefined): AmbientBlobConfig {
  if (raw == null || !String(raw).trim()) {
    return DEFAULT_AMBIENT_BLOB_CONFIG;
  }
  try {
    const parsed: unknown = JSON.parse(String(raw));
    const r = ambientBlobConfigSchema.safeParse(parsed);
    return r.success ? r.data : DEFAULT_AMBIENT_BLOB_CONFIG;
  } catch {
    return DEFAULT_AMBIENT_BLOB_CONFIG;
  }
}

export function defaultAmbientBlobConfigJson(): string {
  return JSON.stringify(DEFAULT_AMBIENT_BLOB_CONFIG);
}
