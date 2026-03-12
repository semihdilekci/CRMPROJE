'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  OpportunityWithDetails,
  StageTransitionInput,
  UpdateStageLogInput,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTransitionStage(opportunityId: string, fairId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: StageTransitionInput) => {
      const { data } = await api.post<ApiSuccessResponse<OpportunityWithDetails>>(
        `/opportunities/${opportunityId}/transition`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.stageHistory(opportunityId),
      });

      if (fairId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.byFair(fairId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.opportunities.byFairFiltered(fairId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.pipelineStats(fairId) });
      }
    },
  });
}

export function useStageHistory(
  opportunityId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.opportunities.stageHistory(opportunityId),
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccessResponse<
          Array<{
            id: string;
            opportunityId: string;
            stage: string;
            note: string | null;
            lossReason: string | null;
            createdAt: string;
            changedBy: { id: string; name: string; email: string };
          }>
        >
      >(`/opportunities/${opportunityId}/stages`);
      return data.data;
    },
    enabled: (options?.enabled ?? true) && !!opportunityId,
  });
}

export function useUpdateStageLog(opportunityId: string, fairId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId, dto }: { logId: string; dto: UpdateStageLogInput }) => {
      await api.patch<ApiSuccessResponse<unknown>>(
        `/opportunities/${opportunityId}/stages/${logId}`,
        dto,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.stageHistory(opportunityId),
      });

      if (fairId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.byFair(fairId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.opportunities.byFairFiltered(fairId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.pipelineStats(fairId) });
      }
    },
  });
}

export function useDeleteLastStageLog(opportunityId: string, fairId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      await api.delete<ApiSuccessResponse<unknown>>(
        `/opportunities/${opportunityId}/stages/${logId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.stageHistory(opportunityId),
      });

      if (fairId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(fairId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.byFair(fairId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.opportunities.byFairFiltered(fairId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.fairs.pipelineStats(fairId) });
      }
    },
  });
}

