'use client';

import type { CustomerListItem } from '@crm/shared';
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

interface CustomerListCardProps {
  customer: CustomerListItem;
  onClick: () => void;
}

export function CustomerListCard({ customer, onClick }: CustomerListCardProps) {
  const gradient = getCardGradient(customer.id);

  return (
    <div className="group relative h-[204px] overflow-visible">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/50 via-cyan-500/50 to-pink-500/50 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <button
        type="button"
        onClick={onClick}
        className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 text-left backdrop-blur-2xl transition-all duration-500 hover:border-white/30 group-hover:scale-[1.02]"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <p
            className="line-clamp-2 min-w-0 text-xl font-semibold text-white transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text group-hover:text-transparent"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {customer.company}
          </p>
          <p className="mt-1.5 text-[14px] text-white/70">{customer.name}</p>

          <div className="mt-auto flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-3 py-1.5 backdrop-blur-xl">
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
                {customer.opportunityCount}
              </span>
              <span className="text-sm text-white/80">fırsat</span>
            </div>
          </div>

          <p className="mt-2 text-[13px] text-white/60">
            Son temas: {customer.lastContact ? formatDate(customer.lastContact) : '-'}
          </p>
        </div>

        <span className="pointer-events-none absolute top-1/2 right-4 z-20 -translate-y-1/2 text-violet-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          →
        </span>

        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </div>
      </button>
    </div>
  );
}
