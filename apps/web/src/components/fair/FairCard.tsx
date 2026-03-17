'use client';

import type { Fair } from '@crm/shared';
import { formatDate } from '@crm/shared';
import { CalendarIcon } from '@/components/ui/CalendarIcon';
import { MapPinIcon } from '@/components/ui/MapPinIcon';

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
    <div className="group relative h-[240px] overflow-visible">
      {/* 1. Gradient border glow — kartın etrafında parlayan gradient border */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/50 via-cyan-500/50 to-pink-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* 2. Main card — glassmorphic kart (%20 kısaltılmış: 240px) */}
      <button
        type="button"
        onClick={onClick}
        className="relative h-full w-full flex cursor-pointer flex-col rounded-2xl border border-white/20 backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 p-5 text-left transition-all duration-500 hover:border-white/30 overflow-hidden group-hover:scale-[1.02]"
      >
        {/* 3. Color overlay — hover'da her kartın unique renk overlay'i */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Başlık + DEVAM EDİYOR rozeti — flex ile çakışma önlenir */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-xl font-semibold text-white line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text transition-all duration-300">
              {fair.name}
            </h3>
            {isActive && (
              <span className="shrink-0 rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-[10px] font-bold text-green-400">
                DEVAM EDİYOR
              </span>
            )}
          </div>

          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-white/70">
            <MapPinIcon size={16} className="mt-0.5 shrink-0 text-violet-400" />
            <span className="line-clamp-2 min-w-0">{fair.address}</span>
          </p>

          <p className={`mt-1 flex items-center gap-1.5 text-sm ${isPast ? 'text-white/50' : 'text-white/70'}`}>
            <CalendarIcon size={16} className="shrink-0 text-cyan-400" />
            <span>{formatDate(fair.startDate)} — {formatDate(fair.endDate)}</span>
          </p>

          <div className="mt-3 flex items-end flex-1 min-h-0">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 backdrop-blur-xl">
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                {opportunityCount}
              </span>
              <span className="text-base text-white/80">fırsat</span>
            </div>
          </div>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-violet-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          →
        </span>
        </div>

        {/* 5. Shine effect — soldan sağa kayarak geçen parlama efekti */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </button>
    </div>
  );
}
