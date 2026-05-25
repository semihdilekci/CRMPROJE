import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFeedbackDto, Feedback, FeedbackCategory } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export interface FeedbackListFilters {
  category?: FeedbackCategory;
  page?: number;
  limit?: number;
}

export interface FeedbackListResponse {
  data: Feedback[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateFeedbackDto) => {
      const { data } = await api.post<{ success: boolean; message: string; data: Feedback }>(
        '/feedback',
        dto,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
  });
}

export function useFeedbackList(filters: FeedbackListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.feedback.list(filters),
    queryFn: async (): Promise<FeedbackListResponse> => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      params.set('page', String(filters.page ?? 1));
      params.set('limit', String(filters.limit ?? 20));
      const { data } = await api.get<{
        success: boolean;
        data: Feedback[];
        meta: FeedbackListResponse['meta'];
      }>(`/feedback?${params.toString()}`);
      return { data: data.data, meta: data.meta };
    },
  });
}
