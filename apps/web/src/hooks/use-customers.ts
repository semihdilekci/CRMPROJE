import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCustomersByFair(fairId: string, search?: string, conversionRate?: string) {
  return useQuery({
    queryKey: queryKeys.customers.byFairFiltered(fairId, search, conversionRate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (conversionRate) params.set('conversionRate', conversionRate);

      const { data } = await api.get<ApiSuccessResponse<Customer[]>>(
        `/fairs/${fairId}/customers?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!fairId,
  });
}

export function useCreateCustomer(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCustomerDto) => {
      const { data } = await api.post<ApiSuccessResponse<Customer>>(
        `/fairs/${fairId}/customers`,
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.byFair(fairId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.byId(fairId),
      });
    },
  });
}

export function useUpdateCustomer(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCustomerDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<Customer>>(`/customers/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.byFair(fairId),
      });
    },
  });
}

export function useDeleteCustomer(fairId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.byFair(fairId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fairs.byId(fairId),
      });
    },
  });
}
