import type { AmbientBlobConfig } from '../schemas/ambient-blob.schema';

export interface SystemSetting {
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

/** Admin panelde değiştirilebilen, uygulama genelinde kullanılan görüntü ayarları. */
export interface DisplayConfig {
  defaultCurrency: string;
  conversionRateLabels: Record<string, string>;
  ambientBlobs: AmbientBlobConfig;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}
