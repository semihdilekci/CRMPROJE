import { ConversionRate } from '../constants/enums';
import { CONVERSION_RATE_LABELS, CONVERSION_RATE_COLORS } from '../constants/conversion-rate';

export function getConversionRateLabel(rate: ConversionRate | null | undefined): string {
  if (!rate) return '—';
  return CONVERSION_RATE_LABELS[rate] ?? '—';
}

export function getConversionRateColor(rate: ConversionRate | null | undefined): string {
  if (!rate) return '#8A8AA0';
  return CONVERSION_RATE_COLORS[rate] ?? '#8A8AA0';
}
