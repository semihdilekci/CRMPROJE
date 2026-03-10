'use client';

import type { OpportunityWithCustomer } from '@crm/shared';
import { CONVERSION_RATES, CONVERSION_RATE_LABELS, CONVERSION_RATE_COLORS } from '@crm/shared';
import { useDisplayConfig } from '@/hooks/use-display-config';

interface FairStatsProps {
  opportunities: OpportunityWithCustomer[];
}

export function FairStats({ opportunities }: FairStatsProps) {
  const { data: displayConfig } = useDisplayConfig();
  const labels = displayConfig?.conversionRateLabels ?? CONVERSION_RATE_LABELS;

  const rateStats = CONVERSION_RATES.map((rate) => {
    const count = opportunities.filter((o) => o.conversionRate === rate).length;
    return {
      rate,
      label: labels[rate],
      color: CONVERSION_RATE_COLORS[rate],
      count,
    };
  }).filter((s) => s.count > 0);

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
      <div className="flex shrink-0 flex-col rounded-xl border border-border bg-card px-5 py-3">
        <span className="text-[26px] font-extrabold text-accent">{opportunities.length}</span>
        <span className="text-[12px] text-muted">Toplam Fırsat</span>
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
