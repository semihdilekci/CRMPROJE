import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  Customer,
  CustomerListItem,
  CustomerListSortBy,
  CustomerProfileResponse,
  OpportunityNote,
  UpdateOpportunityNoteInput,
  CreateCustomerDto,
  UpdateCustomerDto,
} from '@crm/shared';
import { API_ENDPOINTS } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: queryKeys.customers.list(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const { data } = await api.get<ApiSuccessResponse<Customer[]>>(
        `/customers?${params.toString()}`,
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
      if (search) params.set('search', search);
      if (sortBy) params.set('sortBy', sortBy);

      const { data } = await api.get<ApiSuccessResponse<CustomerListItem[]>>(
        `/customers?${params.toString()}`,
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
        `/customers/${id}/profile`,
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
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCustomerDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<Customer>>(
        `/customers/${id}`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
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
    },
  });
}

export function useCreateOpportunityNote(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      opportunityId,
      fairId,
      content,
    }: {
      opportunityId: string;
      fairId: string;
      content: string;
    }) => {
      const { data } = await api.post<ApiSuccessResponse<OpportunityNote>>(
        API_ENDPOINTS.OPPORTUNITIES.NOTES(opportunityId),
        { content },
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.profile(customerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.notes(variables.opportunityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.byFair(variables.fairId),
      });
    },
  });
}

export function useUpdateOpportunityNote(customerId: string) {
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
        dto,
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

export function useDeleteOpportunityNote(customerId: string) {
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
