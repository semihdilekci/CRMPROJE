'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeGradient = 'violet-cyan' | 'orange-pink' | 'emerald-teal';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  gradient?: BadgeGradient;
  className?: string;
  title?: string;
}

const GRADIENT_CLASSES: Record<BadgeGradient, string> = {
  'violet-cyan':
    'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-violet-500/30 text-violet-300',
  'orange-pink':
    'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-500/30 text-orange-300',
  'emerald-teal':
    'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
};

export function Badge({ children, color, gradient, className, title }: BadgeProps) {
  const hasGradient = !!gradient;
  const hasColor = !!color && !hasGradient;

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium',
        'backdrop-blur-xl border',
        !hasColor && !hasGradient && 'bg-white/10 border-white/20 text-white/90',
        hasGradient && GRADIENT_CLASSES[gradient],
        className
      )}
      style={
        hasColor
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
