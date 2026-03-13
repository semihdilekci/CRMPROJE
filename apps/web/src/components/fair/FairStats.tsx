'use client';

import type { OpportunityWithCustomer } from '@crm/shared';
import { CONVERSION_RATES, CONVERSION_RATE_LABELS, CONVERSION_RATE_COLORS } from '@crm/shared';
import { useDisplayConfig } from '@/hooks/use-display-config';

interface FairStatsProps {
  opportunities: OpportunityWithCustomer[];
  selectedRates: string[];
  onRateToggle: (rate: string | null) => void;
}

export function FairStats({ opportunities, selectedRates, onRateToggle }: FairStatsProps) {
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

  const isAllSelected = selectedRates.length === 0;

  return (
    <div className="mb-6 flex h-[103px] items-end justify-center gap-3 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onRateToggle(null)}
        className={`flex shrink-0 flex-col rounded-xl border backdrop-blur-2xl bg-gradient-to-br px-5 py-3 transition-all hover:scale-[1.02] ${
          isAllSelected
            ? 'border-violet-400/60 ring-2 ring-violet-400/40'
            : 'border-white/20 hover:border-white/40'
        } from-white/10 to-white/5`}
      >
        <span className="text-[26px] font-extrabold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {opportunities.length}
        </span>
        <span className="text-[12px] text-white/60">Toplam Fırsat</span>
      </button>

      {rateStats.map((stat) => {
        const isSelected = selectedRates.includes(stat.rate);
        return (
          <button
            key={stat.rate}
            type="button"
            onClick={() => onRateToggle(stat.rate)}
            className={`flex shrink-0 flex-col rounded-xl border-2 backdrop-blur-2xl bg-gradient-to-br px-5 py-3 transition-all hover:scale-[1.02] from-white/10 to-white/5 ${
              isSelected ? 'shadow-lg' : ''
            }`}
            style={{
              borderColor: isSelected ? stat.color : `${stat.color}30`,
              boxShadow: isSelected ? `0 0 0 2px ${stat.color}40` : undefined,
            }}
          >
            <span className="text-[26px] font-extrabold" style={{ color: stat.color }}>
              {stat.count}
            </span>
            <span className="text-[12px] text-white/60">{stat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
