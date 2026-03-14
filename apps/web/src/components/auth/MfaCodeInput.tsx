'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MfaCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onComplete?: (code: string) => void;
}

const DIGITS = 6;

export function MfaCodeInput({
  value,
  onChange,
  error,
  disabled,
  onComplete,
}: MfaCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(DIGITS, ' ').split('').slice(0, DIGITS);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  useEffect(() => {
    if (value.length === DIGITS && /^\d{6}$/.test(value)) {
      onComplete?.(value);
    }
  }, [value, onComplete]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char;
    const joined = newDigits.join('').replace(/\s/g, '');
    onChange(joined.slice(0, DIGITS));
    if (char && index < DIGITS - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
      const newDigits = [...digits];
      newDigits[index - 1] = ' ';
      onChange(newDigits.join('').replace(/\s/g, ''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, DIGITS - 1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/60 text-[12px] font-bold uppercase tracking-wider">
        Doğrulama Kodu
      </label>
      <div
        className="flex gap-2 justify-center"
        onPaste={handlePaste}
      >
        {Array.from({ length: DIGITS }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] === ' ' ? '' : digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={disabled}
            className={cn(
              'w-11 h-12 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm',
              'text-center text-lg font-semibold text-white',
              'transition-colors duration-200',
              'focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30',
              error && 'border-danger focus:border-danger'
            )}
            aria-label={`Rakam ${i + 1}`}
          />
        ))}
      </div>
      {error && <p className="text-[12px] text-danger text-center">{error}</p>}
    </div>
  );
}
