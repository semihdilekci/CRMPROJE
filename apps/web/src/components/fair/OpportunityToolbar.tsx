'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PIPELINE_STAGES, getStageLabel } from '@crm/shared';

interface OpportunityToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  onAddOpportunity: () => void;
}

export function OpportunityToolbar({
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  onAddOpportunity,
}: OpportunityToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <Input
          placeholder="İsim veya firma ara..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-[200px]">
        <Select value={stageFilter} onChange={(e) => onStageFilterChange(e.target.value)}>
          <option value="">Tüm Aşamalar</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {getStageLabel(s.value)}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={onAddOpportunity} className="text-[13px]">
        + Fırsat Ekle
      </Button>
    </div>
  );
}
