import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, AuditLogEntry } from '@crm/shared';
import api from '@/lib/api';

export interface AuditLogFilters {
  from?: string;
  to?: string;
  userId?: string;
  entityType?: string;
}

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.entityType) params.set('entityType', filters.entityType);
      const qs = params.toString();
      const url = qs ? `/audit-log?${qs}` : '/audit-log';
      const { data } = await api.get<ApiSuccessResponse<AuditLogEntry[]>>(url);
      return data.data;
    },
  });
}
