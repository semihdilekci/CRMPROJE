import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  CustomerContact,
  CreateCustomerContactDto,
  UpdateCustomerContactDto,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCustomerContacts(customerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.contacts(customerId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<CustomerContact[]>>(
        `/customers/${customerId}/contacts`,
      );
      return data.data;
    },
    enabled: !!customerId,
  });
}

export function useCreateCustomerContact(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCustomerContactDto & { force?: boolean }) => {
      const { force, ...contactDto } = dto;
      const params = force ? '?force=true' : '';
      const { data } = await api.post<ApiSuccessResponse<CustomerContact>>(
        `/customers/${customerId}/contacts${params}`,
        contactDto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.contacts(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(customerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useUpdateCustomerContact(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCustomerContactDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<CustomerContact>>(
        `/customer-contacts/${id}`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.contacts(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(customerId),
      });
    },
  });
}

export function useDeleteCustomerContact(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      await api.delete(`/customer-contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.contacts(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(customerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
