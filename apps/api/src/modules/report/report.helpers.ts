import { STAGE_WEIGHTS, CONVERSION_RATE_MULTIPLIERS, parseBudgetToNumber } from '@crm/shared';

/**
 * Prisma `where` koşulu için tarih aralığı filtresi oluşturur.
 * Boş parametreler verildiğinde undefined döner (filtre uygulanmaz).
 */
export function buildDateFilter(
  startDate?: string,
  endDate?: string,
  fieldName = 'createdAt',
): Record<string, unknown> | undefined {
  if (!startDate && !endDate) return undefined;

  const filter: Record<string, unknown> = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);

  return { [fieldName]: filter };
}

/**
 * Prisma `where` koşulu için fuar ID filtresi oluşturur.
 */
export function buildFairFilter(
  fairIds: string[],
  fieldName = 'fairId',
): Record<string, unknown> | undefined {
  if (!fairIds.length) return undefined;
  return { [fieldName]: { in: fairIds } };
}

/**
 * budgetRaw string değerini sayıya çevirir (shared util'i sarmalayan kısayol).
 */
export function budgetToNumber(raw: string | null | undefined): number {
  return parseBudgetToNumber(raw);
}

/**
 * Bütçe tutarını sistem kurlarına göre TRY cinsine çevirir.
 * `rates`: SettingsService.getExchangeRates() çıktısı — TRY=1, USD/EUR/GBP = 1 birimin kaç TL olduğu.
 */
export function budgetToTRY(
  raw: string | null | undefined,
  currency: string | null | undefined,
  rates: Record<string, number>,
): number {
  const amount = parseBudgetToNumber(raw);
  const code = (currency && String(currency).trim() !== '' ? String(currency) : 'TRY').toUpperCase();
  const rate = rates[code];
  const effectiveRate = rate !== undefined && Number.isFinite(rate) && rate > 0 ? rate : 1;
  return amount * effectiveRate;
}

/**
 * Ağırlıklı pipeline değeri hesaplar (TRY cinsinden).
 * Formül: bütçe_TRY × aşama ağırlığı × dönüşüm oranı çarpanı
 */
export function calculateWeightedValue(
  budgetRaw: string | null | undefined,
  budgetCurrency: string | null | undefined,
  stage: string,
  conversionRate: string | null | undefined,
  rates: Record<string, number>,
): number {
  const budget = budgetToTRY(budgetRaw, budgetCurrency, rates);
  const stageWeight = STAGE_WEIGHTS[stage] ?? 0;
  const rateMultiplier = CONVERSION_RATE_MULTIPLIERS[conversionRate ?? 'medium'] ?? 0.5;
  return budget * stageWeight * rateMultiplier;
}

/**
 * Son N aya ait ay etiketleri dizisi oluşturur.
 * Format: "Oca 2026", "Şub 2026", ...
 */
export function generateMonthLabels(months: number): Array<{ key: string; label: string; start: Date; end: Date }> {
  const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const result: Array<{ key: string; label: string; start: Date; end: Date }> = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = `${TR_MONTHS[month]} ${year}`;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    result.push({ key, label, start, end });
  }

  return result;
}

/**
 * İki tarih arasındaki gün farkını hesaplar.
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(Math.abs(end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Sayı dizisinin medyanını hesaplar.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * Opportunity dizisinin toplam bütçe değerini TRY cinsinden hesaplar.
 */
export function sumBudgetsTry(
  opportunities: Array<{ budgetRaw?: string | null; budgetCurrency?: string | null }>,
  rates: Record<string, number>,
): number {
  return opportunities.reduce(
    (sum, opp) => sum + budgetToTRY(opp.budgetRaw, opp.budgetCurrency, rates),
    0,
  );
}

/**
 * Yüzde hesaplama (sıfır bölme koruması).
 */
export function safePercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}
