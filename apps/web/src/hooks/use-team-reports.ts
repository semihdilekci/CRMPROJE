import { useQuery } from '@tanstack/react-query';
import type {
  ActivityAnalysisResponse,
  ApiSuccessResponse,
  IndividualPerformanceResponse,
  TeamPerformanceResponse,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface TeamPerformanceFilters {
  startDate?: string;
  endDate?: string;
  teamIds?: string[];
  fairIds?: string[];
}

export function useTeamPerformance(filters: TeamPerformanceFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.teamIds?.length) record.teamIds = filters.teamIds.join(',');
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');

  return useQuery({
    queryKey: queryKeys.reports.teamPerformance(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<TeamPerformanceResponse>>(
        `/reports/team-performance${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface IndividualPerformanceFilters {
  startDate?: string;
  endDate?: string;
  teamIds?: string[];
  fairIds?: string[];
  sortBy?: string;
}

export function useIndividualPerformance(filters: IndividualPerformanceFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.teamIds?.length) record.teamIds = filters.teamIds.join(',');
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.sortBy) record.sortBy = filters.sortBy;

  return useQuery({
    queryKey: queryKeys.reports.individualPerformance(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<IndividualPerformanceResponse>>(
        `/reports/individual-performance${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface ActivityAnalysisFilters {
  startDate?: string;
  endDate?: string;
  userIds?: string[];
  teamIds?: string[];
  activityType?: string;
}

export function useActivityAnalysis(filters: ActivityAnalysisFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.userIds?.length) record.userIds = filters.userIds.join(',');
  if (filters.teamIds?.length) record.teamIds = filters.teamIds.join(',');
  if (filters.activityType) record.activityType = filters.activityType;

  return useQuery({
    queryKey: queryKeys.reports.activityAnalysis(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<ActivityAnalysisResponse>>(
        `/reports/activity-analysis${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}
