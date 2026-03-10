import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccessResponse, User, CreateUserDto, UpdateUserDto } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useUsers(search?: string, role?: string, teamId?: string) {
  const searchNorm = (typeof search === 'string' ? search.trim() : '') || '';
  const roleNorm = (typeof role === 'string' ? role.trim() : '') || '';
  const teamIdNorm = (typeof teamId === 'string' ? teamId.trim() : '') || '';

  return useQuery({
    queryKey: queryKeys.users.list({ search: searchNorm, role: roleNorm, teamId: teamIdNorm }),
    queryFn: async ({ queryKey }) => {
      const [, , filters] = queryKey;
      const { search: s = '', role: r = '', teamId: t = '' } = (filters as { search?: string; role?: string; teamId?: string }) ?? {};
      const params = new URLSearchParams();
      if (s) params.set('search', s);
      if (r) params.set('role', r);
      if (t) params.set('teamId', t);
      const url = params.toString() ? `/users?${params.toString()}` : '/users';
      const { data } = await api.get<ApiSuccessResponse<User[]>>(url);
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
