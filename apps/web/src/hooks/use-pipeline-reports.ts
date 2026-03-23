import { useQuery } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  PipelineOverviewResponse,
  PipelineVelocityResponse,
  WinLossResponse,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface PipelineOverviewFilters {
  fairIds?: string[];
  conversionRate?: string;
  startDate?: string;
  endDate?: string;
}

export function usePipelineOverview(filters: PipelineOverviewFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.conversionRate) record.conversionRate = filters.conversionRate;
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;

  return useQuery({
    queryKey: queryKeys.reports.pipelineOverview(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<PipelineOverviewResponse>>(
        `/reports/pipeline-overview${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface PipelineVelocityFilters {
  fairIds?: string[];
  startDate?: string;
  endDate?: string;
  finalStatus?: string;
}

export function usePipelineVelocity(filters: PipelineVelocityFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.finalStatus) record.finalStatus = filters.finalStatus;

  return useQuery({
    queryKey: queryKeys.reports.pipelineVelocity(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<PipelineVelocityResponse>>(
        `/reports/pipeline-velocity${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface WinLossFilters {
  fairIds?: string[];
  startDate?: string;
  endDate?: string;
  lossReasons?: string[];
  conversionRate?: string;
}

export function useWinLoss(filters: WinLossFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.lossReasons?.length) record.lossReasons = filters.lossReasons.join(',');
  if (filters.conversionRate) record.conversionRate = filters.conversionRate;

  return useQuery({
    queryKey: queryKeys.reports.winLoss(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<WinLossResponse>>(
        `/reports/win-loss${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}
