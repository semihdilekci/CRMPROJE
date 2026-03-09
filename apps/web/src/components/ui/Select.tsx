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
        <label className="text-muted text-[12px] font-bold uppercase tracking-wider">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'rounded-[10px] border border-border bg-surface px-3 py-2.5 text-text',
          'transition-colors duration-200',
          'focus:border-accent focus:outline-none',
          error && 'border-danger',
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
