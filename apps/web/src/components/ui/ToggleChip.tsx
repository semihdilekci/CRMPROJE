'use client';

import { cn } from '@/lib/utils';

interface ToggleChipProps {
  label: string;
  selected: boolean;
  color?: string;
  onClick: () => void;
}

export function ToggleChip({ label, selected, color = '#ff6b35', onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-[8px] border px-3 py-1.5 text-[13px] font-medium',
        'transition-all duration-150',
        selected ? 'border-transparent text-text' : 'border-border text-muted hover:border-muted'
      )}
      style={selected ? { backgroundColor: `${color}25`, borderColor: `${color}50` } : undefined}
    >
      {selected && '✓ '}
      {label}
    </button>
  );
}
