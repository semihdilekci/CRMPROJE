import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', 'list', search ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search?.trim()) params.set('search', search.trim());
      const { data } = await api.get<ApiSuccessResponse<Customer[]>>(
        `/customers?${params.toString()}`
      );
      return data.data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCustomerDto) => {
      const { data } = await api.post<ApiSuccessResponse<Customer>>(
        '/customers',
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCustomerDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<Customer>>(
        `/customers/${id}`,
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}
