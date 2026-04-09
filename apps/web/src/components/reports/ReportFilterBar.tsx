'use client';

import { useState, type ReactNode } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'date' | 'date-range';
  options?: FilterOption[];
  placeholder?: string;
}

interface ReportFilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
  /** Üst bileşenlerdeki ek filtreler (ör. çoklu fuar) — “Filtreleri temizle” görünürlüğü için */
  hasExtraActiveFilters?: boolean;
  /** Aynı kutu içinde, diğer filtrelerden önce (ör. çoklu fuar seçimi) */
  prepend?: ReactNode;
}

export function ReportFilterBar({
  filters,
  values,
  onChange,
  onReset,
  hasExtraActiveFilters = false,
  prepend,
}: ReportFilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleFilters = expanded ? filters : filters.slice(0, 4);
  const hasMore = filters.length > 4;
  const hasActiveFilters = Object.values(values).some(Boolean) || hasExtraActiveFilters;

  return (
    <div className="relative z-[100] flex flex-wrap items-end gap-3 overflow-visible rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 backdrop-blur-lg">
      {prepend}
      {visibleFilters.map((filter) => {
        if (filter.type === 'date' || filter.type === 'date-range') {
          return (
            <div key={filter.key} className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                {filter.label}
              </label>
              <input
                type="date"
                value={values[filter.key] ?? ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="h-8 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-xs text-white outline-none focus:border-violet-500/40"
              />
            </div>
          );
        }

        if (filter.type === 'multi-select' && filter.options?.length) {
          const allVals = filter.options.map((o) => o.value);
          const raw = values[filter.key];
          const selectedSet =
            !raw?.trim() ? new Set(allVals) : new Set(raw.split(',').filter((v) => allVals.includes(v)));
          if (selectedSet.size === 0) allVals.forEach((v) => selectedSet.add(v));

          const toggle = (val: string) => {
            const next = new Set(selectedSet);
            if (next.has(val)) {
              if (next.size <= 1) return;
              next.delete(val);
            } else {
              next.add(val);
            }
            const full = allVals.length > 0 && allVals.every((v) => next.has(v));
            onChange(filter.key, full ? '' : allVals.filter((v) => next.has(v)).join(','));
          };

          return (
            <div key={filter.key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                {filter.label}
              </label>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {filter.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-1.5 text-[11px] text-white/70"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSet.has(opt.value)}
                      onChange={() => toggle(opt.value)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.06] text-violet-500 focus:ring-violet-500/40"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={filter.key} className="flex flex-col gap-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              {filter.label}
            </label>
            <select
              value={values[filter.key] ?? ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="h-8 min-w-[140px] rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-xs text-white outline-none focus:border-violet-500/40"
            >
              <option value="">{filter.placeholder ?? 'Tümü'}</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-[11px] text-violet-400 hover:text-violet-300"
        >
          {expanded ? 'Daha az filtre' : `+${filters.length - 4} filtre daha`}
        </button>
      )}

      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="mt-4 ml-auto text-[11px] text-white/40 hover:text-white/70"
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}
