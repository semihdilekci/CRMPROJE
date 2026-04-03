'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Fair } from '@crm/shared';
import { cn } from '@/lib/utils';

/** `null`: tüm fuarlar seçili (varsayılan). Aksi halde seçili id listesi. */
export type FairPerformanceFairSelection = string[] | null;

interface FairPerformanceFairFilterProps {
  fairs: Fair[] | undefined;
  isLoading: boolean;
  value: FairPerformanceFairSelection;
  onChange: (value: FairPerformanceFairSelection) => void;
}

export function FairPerformanceFairFilter({
  fairs,
  isLoading,
  value,
  onChange,
}: FairPerformanceFairFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allIds = useMemo(() => (fairs ?? []).map((f) => f.id), [fairs]);

  const isFairSelected = useCallback(
    (fairId: string) => {
      if (value === null) return true;
      return value.includes(fairId);
    },
    [value],
  );

  const toggleFair = (fairId: string) => {
    if (value === null) {
      onChange(allIds.filter((id) => id !== fairId));
      return;
    }
    if (value.includes(fairId)) {
      onChange(value.filter((id) => id !== fairId));
    } else {
      const next = [...value, fairId];
      if (next.length === allIds.length) {
        onChange(null);
      } else {
        onChange(next);
      }
    }
  };

  const selectAll = () => {
    onChange(null);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const summaryLabel =
    value === null
      ? `Tüm fuarlar (${allIds.length})`
      : value.length === 0
        ? 'Hiç fuar seçilmedi'
        : `${value.length} fuar seçili`;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">Fuarlar</label>
      <button
        type="button"
        disabled={isLoading || !fairs?.length}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-8 min-w-[200px] items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-left text-xs text-white outline-none',
          'focus:border-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate">{summaryLabel}</span>
        <span className="shrink-0 text-white/40" aria-hidden>
          ▾
        </span>
      </button>
      {open && fairs && fairs.length > 0 && (
        <div
          className="absolute top-full z-[200] mt-1 max-h-72 w-full min-w-[260px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1625]/95 py-2 shadow-2xl backdrop-blur-lg"
          role="listbox"
          aria-multiselectable
        >
          <button
            type="button"
            onClick={selectAll}
            className="mx-2 mb-1 w-[calc(100%-0.5rem)] rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-violet-300 hover:bg-white/10"
          >
            Tümünü seç
          </button>
          <div className="max-h-56 overflow-y-auto px-1">
            {fairs.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/90 hover:bg-white/[0.06]"
              >
                <input
                  type="checkbox"
                  checked={isFairSelected(f.id)}
                  onChange={() => toggleFair(f.id)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-white/25 bg-white/5 accent-violet-500"
                />
                <span className="min-w-0 truncate">{f.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
