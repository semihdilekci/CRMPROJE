export type SecretSource = 'database' | 'environment' | 'none';

/** Admin panelde gösterilen maskelenmiş secret metadata — asla düz metin içermez */
export interface MaskedSecret {
  key: string;
  isConfigured: boolean;
  source: SecretSource;
  maskedPreview: string | null;
  updatedAt: string | null;
  updatedByEmail: string | null;
}
