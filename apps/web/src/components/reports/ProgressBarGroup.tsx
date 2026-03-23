'use client';

import { useEffect, useState } from 'react';
import type { ProgressBarItem } from '@crm/shared';

interface ProgressBarGroupProps {
  items: ProgressBarItem[];
}

function ProgressRow({ item, index }: { item: ProgressBarItem; index: number }) {
  const [animated, setAnimated] = useState(false);
  const pct = item.max > 0 ? Math.min((item.value / item.max) * 100, 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const getColor = () => {
    if (item.color) return item.color;
    if (pct >= 80) return '#4ade80';
    if (pct >= 50) return '#8b5cf6';
    if (pct >= 30) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-[11px] text-white/50" title={item.label}>
        {item.label}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-transform duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: getColor(),
            transform: animated ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
          }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-[11px] font-medium text-white/60">
        %{pct.toFixed(0)}
      </span>
      {item.sublabel && (
        <span className="w-20 shrink-0 text-right text-[10px] text-white/30">
          {item.sublabel}
        </span>
      )}
    </div>
  );
}

export function ProgressBarGroup({ items }: ProgressBarGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <ProgressRow key={item.label} item={item} index={i} />
      ))}
      {items.length === 0 && (
        <div className="py-4 text-center text-sm text-white/30">Veri yok</div>
      )}
    </div>
  );
}
