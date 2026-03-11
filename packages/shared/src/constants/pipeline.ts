export const PIPELINE_STAGES = [
  { value: 'tanisma', label: 'Tanışma', order: 1, terminal: false },
  { value: 'toplanti', label: 'Toplantı', order: 2, terminal: false },
  { value: 'proje', label: 'Proje', order: 3, terminal: false },
  { value: 'teklif', label: 'Teklif', order: 4, terminal: false },
  { value: 'sozlesme', label: 'Sözleşme', order: 5, terminal: false },
  { value: 'satisa_donustu', label: 'Satışa Dönüştü', order: 6, terminal: true },
  { value: 'olumsuz', label: 'Olumsuz Sonuçlandı', order: 7, terminal: true },
] as const;

export const PIPELINE_STAGE_VALUES = PIPELINE_STAGES.map((s) => s.value);

export const LOSS_REASONS = [
  { value: 'price_high', label: 'Fiyat yüksek' },
  { value: 'competitor', label: 'Rakip tercih edildi' },
  { value: 'need_gone', label: 'İhtiyaç ortadan kalktı' },
  { value: 'timing', label: 'Zamanlama uyumsuzluğu' },
  { value: 'communication_lost', label: 'İletişim koptu' },
  { value: 'budget_not_approved', label: 'Bütçe onaylanmadı' },
  { value: 'other', label: 'Diğer' },
] as const;

export const LOSS_REASON_VALUES = LOSS_REASONS.map((r) => r.value);

export type PipelineStageValue = (typeof PIPELINE_STAGE_VALUES)[number];
export type LossReasonValue = (typeof LOSS_REASON_VALUES)[number];

export function getStageLabel(value: string): string {
  const stage = PIPELINE_STAGES.find((s) => s.value === value);
  return stage?.label ?? value;
}

export function getStageOrder(value: string): number {
  const stage = PIPELINE_STAGES.find((s) => s.value === value);
  return stage?.order ?? 0;
}

export function isTerminalStage(value: string): boolean {
  const stage = PIPELINE_STAGES.find((s) => s.value === value);
  return stage?.terminal ?? false;
}

export function getStageBadgeColor(value: string): string {
  const stage = PIPELINE_STAGES.find((s) => s.value === value);
  if (!stage) return '#6B7280';
  if (stage.terminal) {
    return stage.value === 'satisa_donustu' ? '#4ADE80' : '#F87171';
  }
  return '#3B82F6';
}

export function getLossReasonLabel(value: string): string {
  const reason = LOSS_REASONS.find((r) => r.value === value);
  return reason?.label ?? value;
}
