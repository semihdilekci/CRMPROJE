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
    queryKey: queryKeys.customerContacts.byCustomer(customerId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<CustomerContact[]>>(
        `/customers/${customerId}/contacts`
      );
      return data.data;
    },
    enabled: !!customerId,
  });
}

export function useCreateCustomerContact(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCustomerContactDto) => {
      const { data } = await api.post<ApiSuccessResponse<CustomerContact>>(
        `/customers/${customerId}/contacts`,
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customerContacts.byCustomer(customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.profile(customerId) });
    },
  });
}

export function useUpdateCustomerContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
      customerId,
    }: {
      id: string;
      dto: UpdateCustomerContactDto;
      customerId?: string;
    }) => {
      const { data } = await api.patch<ApiSuccessResponse<CustomerContact>>(
        `/customer-contacts/${id}`,
        dto
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      if (variables.customerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerContacts.byCustomer(variables.customerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.customers.profile(variables.customerId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}

export function useDeleteCustomerContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; customerId?: string }) => {
      await api.delete(`/customer-contacts/${id}`);
    },
    onSuccess: (_, variables) => {
      if (variables.customerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerContacts.byCustomer(variables.customerId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.customers.profile(variables.customerId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}
