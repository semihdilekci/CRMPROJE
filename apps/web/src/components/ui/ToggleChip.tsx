'use client';

import { cn } from '@/lib/utils';

interface ToggleChipProps {
  label: string;
  selected: boolean;
  color?: string;
  onClick: () => void;
}

export function ToggleChip({ label, selected, color, onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-medium',
        'transition-all duration-150',
        selected
          ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-white/20 text-white'
          : 'backdrop-blur-xl bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
      )}
      style={
        selected && color
          ? { backgroundColor: `${color}25`, borderColor: `${color}50`, color }
          : undefined
      }
    >
      {selected && '✓ '}
      {label}
    </button>
  );
}
