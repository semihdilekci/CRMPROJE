import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  OpportunityWithDetails,
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreateOpportunity(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateOpportunityDto) => {
      const { data } = await api.post<ApiSuccessResponse<OpportunityWithDetails>>(
        `/fairs/${fairId}/opportunities`,
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(fairId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.pipelineStats(fairId),
      });
    },
  });
}

export function useUpdateOpportunity(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateOpportunityDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<OpportunityWithDetails>>(
        `/opportunities/${id}`,
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(fairId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.pipelineStats(fairId),
      });
    },
  });
}

export function useDeleteOpportunity(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/opportunities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(fairId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.pipelineStats(fairId),
      });
    },
  });
}
