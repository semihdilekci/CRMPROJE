'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-muted text-[12px] font-bold uppercase tracking-wider">{label}</label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'min-h-[80px] resize-y rounded-[10px] border border-border bg-surface px-3 py-2.5 text-text',
          'transition-colors duration-200 placeholder:text-muted/70',
          'focus:border-accent focus:outline-none',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';
