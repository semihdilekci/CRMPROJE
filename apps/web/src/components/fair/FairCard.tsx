'use client';

import type { Fair } from '@crm/shared';
import { formatDate } from '@crm/shared';

interface FairCardProps {
  fair: Fair & { _count?: { customers: number } };
  onClick: () => void;
}

export function FairCard({ fair, onClick }: FairCardProps) {
  const now = new Date();
  const start = new Date(fair.startDate);
  const end = new Date(fair.endDate);
  const isActive = now >= start && now <= end;
  const isPast = now > end;
  const customerCount = (fair as any)._count?.customers ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent"
      style={isActive ? { borderColor: '#ff6b3560' } : undefined}
    >
      {isActive && (
        <span className="absolute top-3 right-3 rounded-full bg-green-soft px-2 py-0.5 text-[10px] font-bold text-green">
          DEVAM EDİYOR
        </span>
      )}

      <h3 className="font-serif text-[19px] font-semibold text-text pr-20">{fair.name}</h3>

      <p className="mt-2 text-[13px] text-muted">📍 {fair.address}</p>

      <p className={`mt-1 text-[13px] ${isPast ? 'text-muted/60' : 'text-muted'}`}>
        📅 {formatDate(fair.startDate)} — {formatDate(fair.endDate)}
      </p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className="text-[20px] font-extrabold text-accent">{customerCount}</span>
          <span className="ml-1.5 text-[13px] text-muted">müşteri kaydı</span>
        </div>
        <span className="text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          →
        </span>
      </div>
    </button>
  );
}
