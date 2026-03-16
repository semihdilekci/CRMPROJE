import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, Fair, FairWithOpportunities } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type FairWithCount = Fair & { _count?: { opportunities: number } };

export function useFairs() {
  return useQuery({
    queryKey: queryKeys.fairs.all,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<FairWithCount[]>>('/fairs');
      return data.data;
    },
  });
}

export function useFairDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.fairs.byId(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<FairWithOpportunities>>(`/fairs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
