import { useQuery } from '@tanstack/react-query';
import type { AuditLogEntry } from '@crm/shared';
import api from '@/lib/api';

export interface AuditLogFilters {
  from?: string;
  to?: string;
  userId?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async (): Promise<AuditLogResponse> => {
      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.entityType) params.set('entityType', filters.entityType);
      params.set('page', String(filters.page ?? 1));
      params.set('limit', String(filters.limit ?? 20));
      const { data } = await api.get<{ success: boolean; data: AuditLogEntry[]; meta: AuditLogResponse['meta'] }>(
        `/audit-log?${params.toString()}`
      );
      return { data: data.data, meta: data.meta };
    },
  });
}
