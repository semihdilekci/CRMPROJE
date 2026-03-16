import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { CreateOfferInput } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64 ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useHasOfferDocument(opportunityId: string) {
  return useQuery({
    queryKey: queryKeys.opportunities.hasOffer(opportunityId),
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { hasOffer: boolean };
      }>(`/opportunities/${opportunityId}/has-offer`);
      return data.data.hasOffer;
    },
    enabled: !!opportunityId,
    staleTime: 30_000,
  });
}

export function useCreateOffer(opportunityId: string, fairId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateOfferInput) => {
      const { data } = await api.post<Blob>(
        `/opportunities/${opportunityId}/create-offer`,
        dto,
        { responseType: 'blob' }
      );
      const ext = dto.outputFormat === 'pdf' ? 'pdf' : 'docx';
      const filename = `teklif-${opportunityId.slice(-8)}.${ext}`;
      const base64 = await blobToBase64(data);
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(path, {
          mimeType:
            ext === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Teklif Paylaş',
        });
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.hasOffer(opportunityId),
      });
      if (fairId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.opportunities.byFair(fairId),
        });
      }
    },
  });
}

export function useDownloadOfferDocument(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<Blob>(
        `/opportunities/${opportunityId}/offer-document`,
        { responseType: 'blob' }
      );
      const base64 = await blobToBase64(data);
      const filename = `teklif-${opportunityId.slice(-8)}.docx`;
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(path, {
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Teklif Paylaş',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.hasOffer(opportunityId),
      });
    },
  });
}
