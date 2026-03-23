'use client';

import type { ReactNode } from 'react';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnalyticsCard({
  title,
  subtitle,
  badge,
  children,
  className = '',
  delay = 0.4,
}: AnalyticsCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.05] backdrop-blur-xl ${className}`}
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        animation: `fadeUp 0.5s ease ${delay}s forwards`,
      }}
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <h3 className="text-[13px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-white/40">{subtitle}</p>}
        </div>
        {badge && (
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-400 border border-violet-500/25">
            {badge}
          </span>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
