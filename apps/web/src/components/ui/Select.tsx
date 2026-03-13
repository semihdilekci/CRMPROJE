'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-2.5 text-white',
          'transition-colors duration-200',
          'focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30',
          error && 'border-danger focus:border-danger',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  )
);

Select.displayName = 'Select';
