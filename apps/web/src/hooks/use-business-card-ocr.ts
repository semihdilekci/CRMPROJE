'use client';

import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import type { ParsedBusinessCard } from '@crm/shared';
import { parseBusinessCardText } from '@crm/shared';

export function useBusinessCardOcr() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanBusinessCard = useCallback(
    async (file: File): Promise<ParsedBusinessCard | null> => {
      setIsLoading(true);
      setError(null);
      let worker = null;

      try {
        worker = await createWorker('tur+eng');
        const {
          data: { text },
        } = await worker.recognize(file);
        const parsed = parseBusinessCardText(text);
        return parsed;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Kartvizit okunamadı. Lütfen daha net bir fotoğraf deneyin.',
        );
        return null;
      } finally {
        if (worker) {
          await worker.terminate();
        }
        setIsLoading(false);
      }
    },
    [],
  );

  return { scanBusinessCard, isLoading, error };
}
