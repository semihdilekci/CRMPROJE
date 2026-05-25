export const PERMISSIONS = [
  'content_editor',
  'content_manager',
  'sales_reporter',
  'manager_reporter',
  'ai_analyst',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  content_editor: 'İçerik Editörü',
  content_manager: 'İçerik Yöneticisi',
  sales_reporter: 'Satışçı Raportör',
  manager_reporter: 'Yönetici Raportör',
  ai_analyst: 'AI Analisti',
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  content_editor:
    'Fuar, müşteri, müşteri temsilcisi ve fırsat verilerini oluşturabilir ve düzenleyebilir (Create & Edit).',
  content_manager:
    'Fuar, müşteri, müşteri temsilcisi ve fırsat verilerini oluşturabilir, düzenleyebilir ve silebilir (Create, Edit & Delete).',
  sales_reporter:
    'Rapor panelinde yalnızca satışçı raportör rolüne atanmış raporları görüntüleyebilir.',
  manager_reporter:
    'Rapor panelinde yalnızca yönetici raportör rolüne atanmış raporları görüntüleyebilir.',
  ai_analyst: 'AI Analiz panelini görüntüleyebilir ve sorgu gönderebilir.',
};

export const REPORTER_TYPES = ['sales_reporter', 'manager_reporter'] as const;
export type ReporterType = (typeof REPORTER_TYPES)[number];

export const REPORTER_TYPE_LABELS: Record<ReporterType, string> = {
  sales_reporter: 'Satışçı Raportör',
  manager_reporter: 'Yönetici Raportör',
};
