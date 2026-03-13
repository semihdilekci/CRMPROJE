'use client';

import type { Fair } from '@crm/shared';
import { formatDate } from '@crm/shared';

const CARD_GRADIENTS = [
  'from-violet-500/20 to-purple-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-pink-500/20 to-rose-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-indigo-500/20 to-blue-500/20',
  'from-fuchsia-500/20 to-pink-500/20',
  'from-lime-500/20 to-green-500/20',
  'from-cyan-500/20 to-sky-500/20',
];

function getCardGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

interface FairCardProps {
  fair: Fair & { _count?: { opportunities: number } };
  onClick: () => void;
}

export function FairCard({ fair, onClick }: FairCardProps) {
  const now = new Date();
  const start = new Date(fair.startDate);
  const end = new Date(fair.endDate);
  const isActive = now >= start && now <= end;
  const isPast = now > end;
  const opportunityCount = (fair as any)._count?.opportunities ?? 0;
  const gradient = getCardGradient(fair.id);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-white/20 backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 text-left transition-all duration-500 hover:scale-[1.02] hover:border-white/30 overflow-hidden"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      {isActive && (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-[10px] font-bold text-green">
          DEVAM EDİYOR
        </span>
      )}

      <div className="relative z-10">
        <h3 className="font-serif text-[19px] font-semibold text-white pr-20 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {fair.name}
        </h3>

        <p className="mt-2 text-[13px] text-white/70">📍 {fair.address}</p>

        <p className={`mt-1 text-[13px] ${isPast ? 'text-white/50' : 'text-white/70'}`}>
          📅 {formatDate(fair.startDate)} — {formatDate(fair.endDate)}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 backdrop-blur-xl">
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              {opportunityCount}
            </span>
            <span className="text-sm text-white/80">fırsat</span>
          </div>
          <span className="text-violet-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            →
          </span>
        </div>
      </div>
    </button>
  );
}
