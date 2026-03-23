'use client';

import type { ActivityFeedItem } from '@crm/shared';

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  maxItems?: number;
}

export function ActivityFeed({ items, maxItems = 10 }: ActivityFeedProps) {
  const display = items.slice(0, maxItems);

  return (
    <div className="flex flex-col">
      {display.map((item, i) => (
        <div
          key={item.id}
          className="flex gap-3 border-b border-white/[0.05] py-2.5 last:border-b-0"
          style={{
            opacity: 0,
            animation: `fadeUp 0.4s ease ${0.1 + i * 0.06}s forwards`,
          }}
        >
          <div
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color ?? '#a78bfa' }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs leading-relaxed text-white/80">{item.text}</div>
            <div className="mt-0.5 text-[11px] text-white/35">
              {item.timestamp}
              {item.context && <span> &middot; {item.context}</span>}
            </div>
          </div>
        </div>
      ))}
      {display.length === 0 && (
        <div className="py-6 text-center text-sm text-white/30">Aktivite yok</div>
      )}
    </div>
  );
}
