'use client';

import { formatDate } from '@crm/shared';
import { Button } from '@/components/ui/Button';
import { CalendarIcon } from '@/components/ui/CalendarIcon';
import { MapPinIcon } from '@/components/ui/MapPinIcon';
import type { FairWithOpportunities } from '@crm/shared';

interface FairDetailHeaderProps {
  fair: FairWithOpportunities;
  onEdit: () => void;
  onDelete: () => void;
}

export function FairDetailHeader({ fair, onEdit, onDelete }: FairDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{fair.name}</h1>
          <p className="mt-1.5 flex items-start gap-1.5 text-[14px] text-white/80">
            <MapPinIcon size={14} className="mt-0.5 shrink-0 text-violet-400" />
            <span>{fair.address}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[14px] text-white/80">
            <CalendarIcon size={14} className="shrink-0 text-cyan-400" />
            <span>{formatDate(fair.startDate)} — {formatDate(fair.endDate)}</span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={onEdit} className="text-[13px]">
            ✏️ Düzenle
          </Button>
          <Button variant="danger" onClick={onDelete} className="text-[13px]">
            🗑 Sil
          </Button>
        </div>
      </div>
    </div>
  );
}
