import { useState, useCallback, useRef } from 'react';
import { authenticateWithBiometric } from '@/lib/biometric';

/** Telefon numarasının görünür kalacağı süre (ms). */
const REVEAL_TIMEOUT_MS = 30_000;

interface UsePhoneRevealResult {
  isRevealed: boolean;
  isAuthenticating: boolean;
  requestReveal: () => Promise<void>;
}

/**
 * Telefon numarasını biyometrik doğrulama sonrası geçici olarak açar.
 * 30 saniye sonra otomatik olarak tekrar maskeler.
 * @see docs/phase-7-security-hardening.md §5 P1-C, §12
 */
export function usePhoneReveal(): UsePhoneRevealResult {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestReveal = useCallback(async () => {
    if (isRevealed || isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometric();
      if (result.success) {
        setIsRevealed(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsRevealed(false);
        }, REVEAL_TIMEOUT_MS);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [isRevealed, isAuthenticating]);

  return { isRevealed, isAuthenticating, requestReveal };
}
