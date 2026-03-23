import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, ExecutiveSummaryResponse } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface ExecutiveSummaryFilters {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export function useExecutiveSummary(filters: ExecutiveSummaryFilters = {}) {
  const filterRecord: Record<string, string> = {};
  if (filters.startDate) filterRecord.startDate = filters.startDate;
  if (filters.endDate) filterRecord.endDate = filters.endDate;
  if (filters.period) filterRecord.period = filters.period;

  return useQuery({
    queryKey: queryKeys.reports.executiveSummary(filterRecord),
    queryFn: async () => {
      const params = new URLSearchParams(filterRecord).toString();
      const url = `/reports/executive-summary${params ? `?${params}` : ''}`;
      const { data } = await api.get<ApiSuccessResponse<ExecutiveSummaryResponse>>(url);
      return data.data;
    },
  });
}
