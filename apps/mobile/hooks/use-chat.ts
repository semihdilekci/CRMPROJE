import { useMutation } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type {
  ApiSuccessResponse,
  ChatQueryInput,
  ChatQueryResponse,
} from '@crm/shared';
import api, { getApiBaseUrl } from '@/lib/api';
import { getAccessToken } from '@/lib/storage';

export function useChatQuery() {
  return useMutation({
    mutationFn: async (input: ChatQueryInput) => {
      const { data } = await api.post<ApiSuccessResponse<ChatQueryResponse>>(
        '/chat/query',
        input,
      );
      return data.data;
    },
  });
}

export async function downloadChatExport(exportId: string): Promise<void> {
  const baseURL = api.defaults.baseURL ?? getApiBaseUrl();
  const url = `${baseURL}/chat/export/${exportId}`;
  const token = await getAccessToken();
  const fileUri = `${FileSystem.documentDirectory}analiz-${exportId}.xlsx`;

  await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Analiz Excel',
    });
  }
}
