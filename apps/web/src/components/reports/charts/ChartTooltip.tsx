'use client';

interface TooltipPayloadItem {
  name?: string;
  value?: unknown;
  dataKey?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (value: unknown, name: string) => string;
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/15 bg-[#0f172a]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-xl">
      {label != null && (
        <p className="mb-1.5 text-xs font-semibold text-white/90">{String(label)}</p>
      )}
      {payload.map((entry, i) => {
        const name = String(entry.dataKey ?? entry.name ?? '');
        const raw = entry.value;
        const display = formatter
          ? formatter(raw, name)
          : typeof raw === 'number'
            ? raw.toLocaleString('tr-TR')
            : String(raw ?? '');
        return (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            {entry.color && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-white/50">{name}:</span>
            <span className="font-medium text-white">{display}</span>
          </div>
        );
      })}
    </div>
  );
}
