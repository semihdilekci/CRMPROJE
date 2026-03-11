import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  OpportunityWithDetails,
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useOpportunitiesByFair(
  fairId: string,
  search?: string,
  conversionRate?: string,
) {
  return useQuery({
    queryKey: queryKeys.opportunities.byFairFiltered(fairId, search, conversionRate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (conversionRate) params.set('conversionRate', conversionRate);

      const { data } = await api.get<ApiSuccessResponse<OpportunityWithDetails[]>>(
        `/fairs/${fairId}/opportunities?${params.toString()}`,
      );
      return data.data;
    },
    enabled: !!fairId,
  });
}

export function useCreateOpportunity(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateOpportunityDto) => {
      const { data } = await api.post<ApiSuccessResponse<OpportunityWithDetails>>(
        `/fairs/${fairId}/opportunities`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(fairId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.byId(fairId),
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
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(fairId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.byId(fairId),
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(fairId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.byId(fairId),
      });
    },
  });
}
