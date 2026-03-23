import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, ForecastResponse, RevenueResponse } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface RevenueFilters {
  startDate?: string;
  endDate?: string;
  fairIds?: string[];
  currency?: string;
  products?: string[];
}

export function useRevenue(filters: RevenueFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.currency) record.currency = filters.currency;
  if (filters.products?.length) record.products = filters.products.join(',');

  return useQuery({
    queryKey: queryKeys.reports.revenue(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<RevenueResponse>>(
        `/reports/revenue${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface ForecastFilters {
  fairIds?: string[];
  startDate?: string;
  endDate?: string;
}

export function useForecast(filters: ForecastFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;

  return useQuery({
    queryKey: queryKeys.reports.forecast(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<ForecastResponse>>(
        `/reports/forecast${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}
