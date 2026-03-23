'use client';

import { useEffect, useRef, useState } from 'react';
import type { KpiItem } from '@crm/shared';

interface KpiCardProps extends KpiItem {
  index?: number;
}

const COLOR_MAP: Record<string, string> = {
  violet: '#a78bfa',
  green: '#4ade80',
  cyan: '#22d3ee',
  orange: '#fb923c',
  amber: '#fbbf24',
  red: '#f87171',
};

const SPARKLINE_COLORS: Record<string, string> = {
  violet: 'rgba(167,139,250,0.35)',
  green: 'rgba(74,222,128,0.35)',
  cyan: 'rgba(34,211,238,0.35)',
  orange: 'rgba(251,146,60,0.35)',
  amber: 'rgba(251,191,36,0.35)',
  red: 'rgba(248,113,113,0.35)',
};

function formatKpiValue(value: number | string, format?: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'currency':
      if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `₺${(value / 1_000).toFixed(0)}K`;
      return `₺${value.toLocaleString('tr-TR')}`;
    case 'percent':
      return `%${value.toFixed(1)}`;
    case 'number':
      return value.toLocaleString('tr-TR');
    default:
      return typeof value === 'number' ? value.toLocaleString('tr-TR') : String(value);
  }
}

export function KpiCard({
  label,
  value,
  trend,
  format,
  color = 'violet',
  icon,
  sparkline,
  index = 0,
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const animRef = useRef<number>(0);
  const numericValue = typeof value === 'number' ? value : null;

  useEffect(() => {
    if (numericValue === null) {
      setDisplayValue(String(value));
      return;
    }
    const start = performance.now();
    const duration = 1000;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(formatKpiValue(numericValue * eased, format));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
      else setDisplayValue(formatKpiValue(numericValue, format));
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [numericValue, value, format]);

  const delay = 0.2 + index * 0.1;
  const textColor = COLOR_MAP[color] ?? COLOR_MAP.violet;
  const sparkColor = SPARKLINE_COLORS[color] ?? SPARKLINE_COLORS.violet;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.05] p-5 backdrop-blur-xl"
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        animation: `fadeUp 0.5s ease ${delay}s forwards`,
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

      {icon && (
        <span className="absolute top-4 right-4 text-xl opacity-35">{icon}</span>
      )}

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </div>

      <div
        className="mb-2.5 text-[34px] font-bold leading-none"
        style={{ fontFamily: 'Playfair Display, serif', color: textColor }}
      >
        {displayValue}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.direction === 'up'
                ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                : trend.direction === 'down'
                  ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                  : 'bg-white/10 text-white/60 border border-white/10'
            }`}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            {' '}{typeof trend.value === 'number' ? trend.value.toLocaleString('tr-TR') : trend.value}
          </span>
          {trend.label && (
            <span className="text-[11px] text-white/40">{trend.label}</span>
          )}
        </div>
      )}

      {sparkline && sparkline.length > 0 && (
        <div className="mt-3.5 flex items-end gap-[3px]" style={{ height: 36 }}>
          {sparkline.map((val, i) => {
            const max = Math.max(...sparkline, 1);
            const heightPct = (val / max) * 100;
            return (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: sparkColor,
                  transformOrigin: 'bottom',
                  transform: 'scaleY(0)',
                  animation: `barGrow 0.8s ease ${delay + 0.2 + i * 0.05}s forwards`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
