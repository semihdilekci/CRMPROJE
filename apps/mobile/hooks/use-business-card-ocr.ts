import { useState, useCallback } from 'react';
import type { ParsedBusinessCard } from '@crm/shared';
import { API_ENDPOINTS, type ApiSuccessResponse } from '@crm/shared';
import api from '@/lib/api';

interface CardImageOcrResponse {
  url: string;
  parsed: ParsedBusinessCard;
}

export function useBusinessCardOcr() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanBusinessCard = useCallback(
    async (
      uri: string,
      filename: string,
      type: string,
    ): Promise<{ url: string; parsed: ParsedBusinessCard } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as unknown as Blob);

        const { data } = await api.post<
          ApiSuccessResponse<CardImageOcrResponse>
        >(API_ENDPOINTS.UPLOAD.CARD_IMAGE_OCR, formData);

        if (data.success && data.data) {
          return data.data;
        }
        setError('Kartvizit okunamadı');
        return null;
      } catch {
        setError(
          'Kartvizit okunamadı. Lütfen daha net bir fotoğraf deneyin.',
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { scanBusinessCard, isLoading, error };
}
