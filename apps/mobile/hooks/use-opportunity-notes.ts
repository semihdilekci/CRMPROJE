import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpportunityNote, ApiSuccessResponse } from '@crm/shared';
import { API_ENDPOINTS } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useOpportunityNotes(opportunityId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.opportunities.notes(opportunityId),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<OpportunityNote[]>>(
        API_ENDPOINTS.OPPORTUNITIES.NOTES(opportunityId),
      );
      return data.success && data.data ? data.data : [];
    },
    enabled: !!opportunityId && (options?.enabled ?? true),
  });
}

export function useCreateOpportunityNote(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<ApiSuccessResponse<OpportunityNote>>(
        API_ENDPOINTS.OPPORTUNITIES.NOTES(opportunityId),
        { content },
      );
      if (!data.success || !data.data) throw new Error('Not eklenemedi');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.notes(opportunityId) });
    },
  });
}

export function useUpdateOpportunityNote(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      content,
    }: {
      noteId: string;
      content: string;
    }) => {
      const { data } = await api.patch<ApiSuccessResponse<OpportunityNote>>(
        API_ENDPOINTS.OPPORTUNITIES.NOTE_BY_ID(opportunityId, noteId),
        { content },
      );
      if (!data.success || !data.data) throw new Error('Not güncellenemedi');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.notes(opportunityId) });
    },
  });
}

export function useDeleteOpportunityNote(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      await api.delete(
        API_ENDPOINTS.OPPORTUNITIES.NOTE_BY_ID(opportunityId, noteId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.notes(opportunityId) });
    },
  });
}
