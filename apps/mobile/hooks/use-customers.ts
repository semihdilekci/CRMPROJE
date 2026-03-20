import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  Customer,
  CustomerListItem,
  CustomerListSortBy,
  CustomerProfileResponse,
  CreateCustomerDto,
  UpdateCustomerDto,
  UpdateOpportunityNoteInput,
  OpportunityNote,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/** Fuar formu / müşteri seçimi — liste endpoint’i ile uyumlu (varsayılan sıralama: son temas). */
export function useCustomers(search?: string) {
  return useQuery({
    queryKey: queryKeys.customers.list(search, 'lastContact'),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search?.trim()) params.set('search', search.trim());
      params.set('sortBy', 'lastContact');
      const { data } = await api.get<ApiSuccessResponse<CustomerListItem[]>>(
        `/customers?${params.toString()}`
      );
      return data.data;
    },
  });
}

export function useCustomerList(search?: string, sortBy: CustomerListSortBy = 'lastContact') {
  return useQuery({
    queryKey: queryKeys.customers.list(search, sortBy),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search?.trim()) params.set('search', search.trim());
      params.set('sortBy', sortBy);
      const { data } = await api.get<ApiSuccessResponse<CustomerListItem[]>>(
        `/customers?${params.toString()}`
      );
      return data.data;
    },
  });
}

export function useCustomerProfile(id: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.profile(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<CustomerProfileResponse>>(
        `/customers/${id}/profile`
      );
      return data.data;
    },
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateCustomerDto;
      fairId?: string;
    }) => {
      const { data } = await api.patch<ApiSuccessResponse<Customer>>(
        `/customers/${id}`,
        dto
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
      if (variables.fairId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.fairs.byId(variables.fairId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.opportunities.byFair(variables.fairId),
        });
      }
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.fairs.all });
    },
  });
}

export function useUpdateOpportunityNoteForProfile(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      opportunityId,
      noteId,
      dto,
    }: {
      opportunityId: string;
      noteId: string;
      dto: UpdateOpportunityNoteInput;
    }) => {
      const { data } = await api.patch<ApiSuccessResponse<OpportunityNote>>(
        `/opportunities/${opportunityId}/notes/${noteId}`,
        dto
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(customerId),
      });
    },
  });
}

export function useDeleteOpportunityNoteForProfile(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      opportunityId,
      noteId,
    }: {
      opportunityId: string;
      noteId: string;
    }) => {
      await api.delete(`/opportunities/${opportunityId}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(customerId),
      });
    },
  });
}
