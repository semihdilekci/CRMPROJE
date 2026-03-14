'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOfferInput } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreateOffer(opportunityId: string, fairId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateOfferInput) => {
      const { data } = await api.post<Blob>(
        `/opportunities/${opportunityId}/create-offer`,
        dto,
        { responseType: 'blob' },
      );
      const ext = dto.outputFormat === 'pdf' ? 'pdf' : 'docx';
      const filename = `teklif-${opportunityId.slice(-8)}.${ext}`;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.hasOffer(opportunityId) });
      if (fairId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.byFair(fairId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.opportunities.byFairFiltered(fairId),
        });
      }
    },
  });
}

export function useHasOfferDocument(opportunityId: string) {
  return useQuery({
    queryKey: queryKeys.opportunities.hasOffer(opportunityId),
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { hasOffer: boolean } }>(
        `/opportunities/${opportunityId}/has-offer`,
      );
      return data.data.hasOffer;
    },
    enabled: !!opportunityId,
    staleTime: 30_000,
  });
}

export function useDownloadOfferDocument(opportunityId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<Blob>(
        `/opportunities/${opportunityId}/offer-document`,
        { responseType: 'blob' },
      );
      const filename = `teklif-${opportunityId.slice(-8)}.docx`;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
}
