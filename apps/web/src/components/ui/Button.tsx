'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 hover:opacity-95',
  secondary:
    'backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
  danger:
    'backdrop-blur-xl bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30 hover:border-danger/50',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'cursor-pointer rounded-lg px-4 py-2.5 text-[14px] font-semibold',
        'transition-all duration-150 whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
