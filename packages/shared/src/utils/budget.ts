export function formatBudget(raw: string | null | undefined): string {
  if (!raw) return '—';

  const cleaned = raw.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);

  if (isNaN(num)) return '—';

  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseBudgetRaw(display: string): string {
  return display.replace(/\./g, '').replace(',', '.');
}

/** budgetRaw string'ini sayıya çevirir. Geçersiz veya boş ise 0 döner. */
export function parseBudgetToNumber(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
