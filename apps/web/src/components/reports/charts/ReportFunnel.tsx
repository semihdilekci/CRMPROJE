'use client';

import { useEffect, useState } from 'react';
import { CHART_COLORS } from './chart-theme';

interface FunnelItem {
  name: string;
  value: number;
  color?: string;
}

interface ReportFunnelProps {
  data: FunnelItem[];
  height?: number;
  formatter?: (value: number) => string;
}

export function ReportFunnel({
  data,
  height = 300,
  formatter,
}: ReportFunnelProps) {
  const [animated, setAnimated] = useState(false);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2" style={{ minHeight: height }}>
      {data.map((item, i) => {
        const widthPct = (item.value / maxValue) * 100;
        const color = item.color ?? CHART_COLORS.primary[i % CHART_COLORS.primary.length];
        return (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-right text-[11px] text-white/50">
              {item.name}
            </span>
            <div className="relative flex-1 h-7 rounded bg-white/[0.04] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded transition-transform duration-1000 ease-out"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: color,
                  opacity: 0.7,
                  transform: animated ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                }}
              />
              <span className="relative z-10 flex h-full items-center px-2 text-[11px] font-semibold text-white">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
