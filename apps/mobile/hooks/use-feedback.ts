import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFeedbackDto, Feedback } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

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
