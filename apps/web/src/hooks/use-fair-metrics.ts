import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, FairMetrics } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useFairMetrics(fairId: string | null) {
  return useQuery({
    queryKey: queryKeys.fairs.metrics(fairId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<FairMetrics>>(
        `/fairs/${fairId}/metrics`
      );
      return data.data;
    },
    enabled: !!fairId,
  });
}
