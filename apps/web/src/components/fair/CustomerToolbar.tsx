'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CONVERSION_RATE_LABELS, type ConversionRate } from '@crm/shared';

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
          {(Object.entries(CONVERSION_RATE_LABELS) as [ConversionRate, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </Select>
      </div>
      <Button onClick={onAddCustomer} className="text-[13px]">
        + Müşteri Ekle
      </Button>
    </div>
  );
}
