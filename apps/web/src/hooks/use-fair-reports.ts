import { useQuery } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  FairPerformanceResponse,
  FairComparisonResponse,
  FairTargetsResponse,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface FairPerformanceFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  createdById?: string;
}

export function useFairPerformance(filters: FairPerformanceFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.status) record.status = filters.status;
  if (filters.createdById) record.createdById = filters.createdById;

  return useQuery({
    queryKey: queryKeys.reports.fairPerformance(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const url = `/reports/fair-performance${params ? `?${params}` : ''}`;
      const { data } = await api.get<ApiSuccessResponse<FairPerformanceResponse>>(url);
      return data.data;
    },
  });
}

export function useFairComparison(fairIds: string[]) {
  return useQuery({
    queryKey: queryKeys.reports.fairComparison(fairIds),
    queryFn: async () => {
      const params = fairIds.length > 0 ? `?fairIds=${fairIds.join(',')}` : '';
      const url = `/reports/fair-comparison${params}`;
      const { data } = await api.get<ApiSuccessResponse<FairComparisonResponse>>(url);
      return data.data;
    },
    enabled: fairIds.length >= 2,
  });
}

interface FairTargetsFilters {
  fairIds?: string[];
  status?: string;
}

export function useFairTargets(filters: FairTargetsFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.status) record.status = filters.status;

  return useQuery({
    queryKey: queryKeys.reports.fairTargets(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const url = `/reports/fair-targets${params ? `?${params}` : ''}`;
      const { data } = await api.get<ApiSuccessResponse<FairTargetsResponse>>(url);
      return data.data;
    },
  });
}
