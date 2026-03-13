'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white placeholder:text-white/50',
          'transition-colors duration-200',
          'focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30',
          error && 'border-danger focus:border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
