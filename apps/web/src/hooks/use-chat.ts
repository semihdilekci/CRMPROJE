'use client';

import { useMutation } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  ChatQueryInput,
  ChatQueryResponse,
} from '@crm/shared';
import api from '@/lib/api';

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
  const { data } = await api.get(`/chat/export/${exportId}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `analiz-${exportId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
