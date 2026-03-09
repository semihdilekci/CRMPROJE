'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = '#8a8aa0', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[6px] px-2 py-0.5 text-[12px] font-medium',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}40`,
        color,
      }}
    >
      {children}
    </span>
  );
}
