import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccessResponse, User, CreateUserDto, UpdateUserDto } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUsers(search?: string, role?: string) {
  return useQuery({
    queryKey: queryKeys.users.list({ search, role }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      const { data } = await api.get<ApiSuccessResponse<User[]>>(`/users?${params.toString()}`);
      return data.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateUserDto) => {
      const { data } = await api.post<ApiSuccessResponse<User>>('/users', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateUserDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<User>>(`/users/${id}`, dto);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byId(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
