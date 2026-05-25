import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse } from '@crm/shared';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/query-keys';

interface PermissionsData {
  permissions: string[];
  allowedReportSlugs: string[];
}

export function usePermissions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.permissions.me,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<PermissionsData>>('/permissions/me');
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) => {
      if (user?.role === 'admin') {
        return {
          permissions: [
            'content_editor',
            'content_manager',
            'sales_reporter',
            'manager_reporter',
            'ai_analyst',
            ...(data?.permissions ?? []),
          ],
          allowedReportSlugs: data?.allowedReportSlugs ?? [],
        };
      }
      return data;
    },
  });
}

export function useHasPermission(permission: string): boolean {
  const { data } = usePermissions();
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'admin') return true;
  return data?.permissions.includes(permission) ?? false;
}

export function useAllowedReportSlugs(): string[] {
  const { data } = usePermissions();
  return data?.allowedReportSlugs ?? [];
}
