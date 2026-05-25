import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  EffectivePermissions,
  UserPermissionsResponse,
  TeamPermissionsResponse,
  UpdateUserPermissionsDto,
  UpdateTeamPermissionsDto,
  UpdateReporterReportsDto,
  ReporterType,
} from '@crm/shared';
import { API_ENDPOINTS } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export function useMyPermissions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.permissions.me(),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<EffectivePermissions>>(
        API_ENDPOINTS.PERMISSIONS.ME,
      );
      return data.data!;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: queryKeys.permissions.user(userId),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<UserPermissionsResponse>>(
        API_ENDPOINTS.PERMISSIONS.USER(userId),
      );
      return data.data!;
    },
    enabled: !!userId,
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, dto }: { userId: string; dto: UpdateUserPermissionsDto }) => {
      const { data } = await api.put<ApiSuccessResponse<UserPermissionsResponse>>(
        API_ENDPOINTS.PERMISSIONS.USER(userId),
        dto,
      );
      return data.data!;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.user(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.me() });
    },
  });
}

export function useTeamPermissions(teamId: string) {
  return useQuery({
    queryKey: queryKeys.permissions.team(teamId),
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<TeamPermissionsResponse>>(
        API_ENDPOINTS.PERMISSIONS.TEAM(teamId),
      );
      return data.data!;
    },
    enabled: !!teamId,
  });
}

export function useUpdateTeamPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, dto }: { teamId: string; dto: UpdateTeamPermissionsDto }) => {
      const { data } = await api.put<ApiSuccessResponse<TeamPermissionsResponse>>(
        API_ENDPOINTS.PERMISSIONS.TEAM(teamId),
        dto,
      );
      return data.data!;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.team(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.me() });
    },
  });
}

export function useReporterReportAccess() {
  return useQuery({
    queryKey: queryKeys.permissions.reporterReports(),
    queryFn: async () => {
      const { data } = await api.get<
        ApiSuccessResponse<{ reporterType: ReporterType; reportSlug: string; enabled: boolean }[]>
      >(API_ENDPOINTS.PERMISSIONS.REPORTER_REPORTS);
      return data.data!;
    },
  });
}

export function useUpdateReporterReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: UpdateReporterReportsDto) => {
      const { data } = await api.put<
        ApiSuccessResponse<{ reporterType: ReporterType; reportSlug: string; enabled: boolean }[]>
      >(API_ENDPOINTS.PERMISSIONS.REPORTER_REPORTS, dto);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.reporterReports() });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.me() });
    },
  });
}
