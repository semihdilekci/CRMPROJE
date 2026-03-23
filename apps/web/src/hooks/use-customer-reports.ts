import { useQuery } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  CustomerLifecycleResponse,
  CustomerOverviewResponse,
  CustomerSegmentationResponse,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface CustomerOverviewFilters {
  fairIds?: string[];
  startDate?: string;
  endDate?: string;
  conversionRate?: string;
}

export function useCustomerOverview(filters: CustomerOverviewFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.conversionRate) record.conversionRate = filters.conversionRate;

  return useQuery({
    queryKey: queryKeys.reports.customerOverview(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<CustomerOverviewResponse>>(
        `/reports/customer-overview${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface CustomerSegmentationFilters {
  fairIds?: string[];
  criterion?: string;
}

export function useCustomerSegmentation(filters: CustomerSegmentationFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.criterion) record.criterion = filters.criterion;

  return useQuery({
    queryKey: queryKeys.reports.customerSegmentation(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<CustomerSegmentationResponse>>(
        `/reports/customer-segmentation${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface CustomerLifecycleFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  fairIds?: string[];
}

export function useCustomerLifecycle(filters: CustomerLifecycleFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.status) record.status = filters.status;
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');

  return useQuery({
    queryKey: queryKeys.reports.customerLifecycle(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<CustomerLifecycleResponse>>(
        `/reports/customer-lifecycle${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}
