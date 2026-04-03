'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { clsx } from 'clsx';

export type SliderProps = {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
};

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step,
  disabled,
  'aria-label': ariaLabel,
  className,
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={clsx(
        'relative flex h-5 w-full touch-none select-none items-center',
        className,
      )}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-white/15">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={clsx(
          'block size-4 shrink-0 rounded-full border border-white/40 bg-white shadow-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
          'disabled:pointer-events-none disabled:opacity-40',
        )}
      />
    </SliderPrimitive.Root>
  );
}
