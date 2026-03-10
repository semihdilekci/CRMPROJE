import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  TeamWithUserCount,
  CreateTeamDto,
  UpdateTeamDto,
} from '@crm/shared';
import api from '@/lib/api';

const TEAMS_KEY = ['teams'] as const;

export function useTeams(search?: string, active?: boolean) {
  const searchNorm = (typeof search === 'string' ? search.trim() : '') || '';
  return useQuery({
    queryKey: ['teams', 'list', { search: searchNorm, active }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchNorm) params.set('search', searchNorm);
      if (active !== undefined) params.set('active', String(active));
      const qs = params.toString();
      const url = qs ? `/teams?${qs}` : '/teams';
      const { data } = await api.get<ApiSuccessResponse<TeamWithUserCount[]>>(url);
      return data.data;
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTeamDto) => {
      const { data } = await api.post<ApiSuccessResponse<TeamWithUserCount>>('/teams', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTeamDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<TeamWithUserCount>>(`/teams/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
  });
}
