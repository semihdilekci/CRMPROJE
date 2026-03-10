'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CONVERSION_RATE_LABELS, type ConversionRate } from '@crm/shared';
import { useDisplayConfig } from '@/hooks/use-display-config';

interface CustomerToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  rateFilter: string;
  onRateFilterChange: (value: string) => void;
  onAddCustomer: () => void;
}

export function CustomerToolbar({
  search,
  onSearchChange,
  rateFilter,
  onRateFilterChange,
  onAddCustomer,
}: CustomerToolbarProps) {
  const { data: displayConfig } = useDisplayConfig();
  const labels = displayConfig?.conversionRateLabels ?? CONVERSION_RATE_LABELS;

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <Input
          placeholder="İsim veya firma ara..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-[180px]">
        <Select value={rateFilter} onChange={(e) => onRateFilterChange(e.target.value)}>
          <option value="">Tüm Dönüşümler</option>
          {(Object.entries(labels) as [ConversionRate, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={onAddCustomer} className="text-[13px]">
        + Müşteri Ekle
      </Button>
    </div>
  );
}
