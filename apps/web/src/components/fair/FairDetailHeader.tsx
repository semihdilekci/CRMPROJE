'use client';

import { formatDate } from '@crm/shared';
import { Button } from '@/components/ui/Button';
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
          <h1 className="font-serif text-[28px] font-semibold text-text">{fair.name}</h1>
          <p className="mt-1.5 text-[14px] text-muted">📍 {fair.address}</p>
          <p className="mt-1 text-[14px] text-muted">
            📅 {formatDate(fair.startDate)} — {formatDate(fair.endDate)}
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
