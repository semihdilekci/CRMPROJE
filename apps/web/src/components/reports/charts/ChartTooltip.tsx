'use client';

interface TooltipPayloadItem {
  name?: string;
  value?: unknown;
  dataKey?: string;
  color?: string;
  /** Bar/Line: üzerine gelinen veri satırı (fuar adı vb.) */
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (value: unknown, name: string) => string;
  /** Recharts dataKey → kullanıcıya gösterilecek etiket (örn. opportunityCount → Fırsat Sayısı) */
  dataKeyLabels?: Record<string, string>;
  /**
   * Gruplu çubuk / çizgi grafiklerde Recharts bazen `label` olarak kategori indeksi (0,1,2) verir.
   * Verildiğinde başlık önce `payload[0].payload[categoryLabelKey]` okunur (örn. `name` → fuar adı).
   */
  categoryLabelKey?: string;
  /**
   * Scatter vb.: yalnızca bu dataKey’lere ait satırlar gösterilir (sıra bu diziye göre).
   * Z ekseni (bubble boyutu) tooltip’te gizlenmek için kullanılır.
   */
  includePayloadDataKeys?: string[];
}

function resolveCategoryTitle(
  label: unknown,
  payload: TooltipPayloadItem[] | undefined,
  categoryLabelKey?: string,
): string | undefined {
  const key = categoryLabelKey;
  if (key && payload?.[0]?.payload && typeof payload[0].payload === 'object') {
    const raw = payload[0].payload[key];
    if (raw != null && String(raw).trim() !== '') {
      return String(raw);
    }
  }
  if (label != null && String(label).trim() !== '') {
    return String(label);
  }
  return undefined;
}

function filterPayloadByDataKeys(
  payload: TooltipPayloadItem[],
  keys: string[] | undefined,
): TooltipPayloadItem[] {
  if (!keys?.length) return payload;
  return keys
    .map((key) => payload.find((e) => String(e.dataKey ?? e.name) === key))
    .filter((e): e is TooltipPayloadItem => e != null);
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  dataKeyLabels,
  categoryLabelKey,
  includePayloadDataKeys,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const title = resolveCategoryTitle(label, payload, categoryLabelKey);
  const rows = filterPayloadByDataKeys(payload, includePayloadDataKeys);

  return (
    <div className="rounded-xl border border-white/15 bg-[#0f172a]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-xl">
      {title != null && (
        <p className="mb-1.5 text-xs font-semibold text-white/90">{title}</p>
      )}
      {rows.map((entry, i) => {
        const dataKey = String(entry.dataKey ?? entry.name ?? '');
        const displayName = dataKeyLabels?.[dataKey] ?? dataKey;
        const raw = entry.value;
        const display = formatter
          ? formatter(raw, dataKey)
          : typeof raw === 'number'
            ? raw.toLocaleString('tr-TR')
            : String(raw ?? '');
        return (
          <div key={`${String(entry.dataKey)}-${i}`} className="flex items-center gap-2 text-[11px]">
            {entry.color && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-white/50">{displayName}:</span>
            <span className="font-medium text-white">{display}</span>
          </div>
        );
      })}
    </div>
  );
}
