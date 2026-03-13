'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium',
        'backdrop-blur-xl border',
        !color && 'bg-white/10 border-white/20 text-white/90',
        className
      )}
      style={
        color
          ? {
              backgroundColor: `${color}20`,
              borderColor: `${color}40`,
              color,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}
