'use client';

import type { LeaderboardItem } from '@crm/shared';

interface LeaderboardProps {
  items: LeaderboardItem[];
  maxItems?: number;
}

const RANK_COLORS = ['#fbbf24', '#94a3b8', '#cd7f32'];

export function Leaderboard({ items, maxItems = 5 }: LeaderboardProps) {
  const display = items.slice(0, maxItems);

  return (
    <div className="flex flex-col">
      {display.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-b-0"
          style={{
            opacity: 0,
            animation: `fadeUp 0.4s ease ${0.1 + i * 0.08}s forwards`,
          }}
        >
          <span
            className="w-5 shrink-0 text-center text-[11px] font-semibold"
            style={{ color: i < 3 ? RANK_COLORS[i] : 'rgba(248,250,252,0.4)' }}
          >
            {item.rank}
          </span>

          {item.avatarInitials && (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{
                background: item.avatarColor ?? 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              }}
            >
              {item.avatarInitials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="truncate text-[13px] font-semibold text-white">
              {item.label}
            </div>
            {item.sublabel && (
              <div className="truncate text-[11px] text-white/40">
                {item.sublabel}
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="text-[13px] font-bold text-amber-400">
              {typeof item.value === 'number' ? item.value.toLocaleString('tr-TR') : item.value}
            </div>
            {item.secondary && (
              <div className="text-[11px] text-white/40">{item.secondary}</div>
            )}
          </div>
        </div>
      ))}
      {display.length === 0 && (
        <div className="py-6 text-center text-sm text-white/30">Veri yok</div>
      )}
    </div>
  );
}
