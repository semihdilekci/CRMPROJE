import { ConversionRate } from './enums';

export const CONVERSION_RATE_COLORS: Record<ConversionRate, string> = {
  very_high: '#4ADE80',
  high: '#86EFAC',
  medium: '#FFB347',
  low: '#FB923C',
  very_low: '#F87171',
};

export const CONVERSION_RATE_LABELS: Record<ConversionRate, string> = {
  very_high: 'Çok Yüksek',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  very_low: 'Çok Düşük',
};
