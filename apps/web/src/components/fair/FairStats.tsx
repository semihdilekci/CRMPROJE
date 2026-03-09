'use client';

import type { Customer } from '@crm/shared';
import { CONVERSION_RATES, CONVERSION_RATE_LABELS, CONVERSION_RATE_COLORS } from '@crm/shared';

interface FairStatsProps {
  customers: Customer[];
}

export function FairStats({ customers }: FairStatsProps) {
  const rateStats = CONVERSION_RATES.map((rate) => {
    const count = customers.filter((c) => c.conversionRate === rate).length;
    return {
      rate,
      label: CONVERSION_RATE_LABELS[rate],
      color: CONVERSION_RATE_COLORS[rate],
      count,
    };
  }).filter((s) => s.count > 0);

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
      <div className="flex shrink-0 flex-col rounded-xl border border-border bg-card px-5 py-3">
        <span className="text-[26px] font-extrabold text-accent">{customers.length}</span>
        <span className="text-[12px] text-muted">Toplam Müşteri</span>
      </div>

      {rateStats.map((stat) => (
        <div
          key={stat.rate}
          className="flex shrink-0 flex-col rounded-xl border bg-card px-5 py-3"
          style={{ borderColor: `${stat.color}30` }}
        >
          <span className="text-[26px] font-extrabold" style={{ color: stat.color }}>
            {stat.count}
          </span>
          <span className="text-[12px] text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
