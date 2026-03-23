'use client';

import { useState } from 'react';

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
}

export function ReportFilterBar({ filters, values, onChange, onReset }: ReportFilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleFilters = expanded ? filters : filters.slice(0, 4);
  const hasMore = filters.length > 4;
  const hasActiveFilters = Object.values(values).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 backdrop-blur-lg">
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
