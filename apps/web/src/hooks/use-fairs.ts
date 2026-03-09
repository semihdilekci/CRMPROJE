import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  Fair,
  FairWithCustomers,
  CreateFairDto,
  UpdateFairDto,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useFairs() {
  return useQuery({
    queryKey: queryKeys.fairs.all,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<Fair[]>>('/fairs');
      return data.data;
    },
  });
}

export function useFairDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.fairs.byId(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<FairWithCustomers>>(`/fairs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateFair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateFairDto) => {
      const { data } = await api.post<ApiSuccessResponse<Fair>>('/fairs', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}

export function useUpdateFair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateFairDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<Fair>>(`/fairs/${id}`, dto);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.byId(id) });
    },
  });
}

export function useDeleteFair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/fairs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}
