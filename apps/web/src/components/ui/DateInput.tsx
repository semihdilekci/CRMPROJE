'use client';

import { useRef } from 'react';
import { formatDateInput, parseDateInput } from '@crm/shared';
import { cn } from '@/lib/utils';

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (ddMmYyyy: string) => void;
  error?: string;
  placeholder?: string;
}

/** value ve onChange dd.mm.yyyy formatında */
export function DateInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'gg.aa.yyyy',
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value
    ? (value.includes('.') ? value : formatDateInput(value))
    : '';

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.replace(/[^0-9.]/g, '');
    if (text.length <= 10) onChange(text);
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (iso) onChange(formatDateInput(new Date(iso + 'T12:00:00').toISOString()));
  };

  const isoValue = (() => {
    const parsed = parseDateInput(displayValue);
    return parsed ? parsed.slice(0, 10) : '';
  })();

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
          {label}
        </label>
      ) : null}
      <div className="flex gap-2">
        <input
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={cn(
            'flex-1 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white placeholder:text-white/50',
            'focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30',
            error && 'border-danger focus:border-danger'
          )}
        />
        <div className="relative w-10 h-10">
          <span className="absolute inset-0 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center text-white/80 pointer-events-none">
            📅
          </span>
          <input
            ref={inputRef}
            type="date"
            value={isoValue}
            onChange={handleNativeChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Tarih seç"
          />
        </div>
      </div>
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}
