import { useQuery } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  ProductAnalysisResponse,
  ProductFairMatrixResponse,
} from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface ProductAnalysisFilters {
  fairIds?: string[];
  startDate?: string;
  endDate?: string;
  stageFilter?: string;
}

export function useProductAnalysis(filters: ProductAnalysisFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.startDate) record.startDate = filters.startDate;
  if (filters.endDate) record.endDate = filters.endDate;
  if (filters.stageFilter) record.stageFilter = filters.stageFilter;

  return useQuery({
    queryKey: queryKeys.reports.productAnalysis(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<ProductAnalysisResponse>>(
        `/reports/product-analysis${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

interface ProductFairMatrixFilters {
  fairIds?: string[];
  products?: string[];
  metric?: string;
}

export function useProductFairMatrix(filters: ProductFairMatrixFilters = {}) {
  const record: Record<string, string> = {};
  if (filters.fairIds?.length) record.fairIds = filters.fairIds.join(',');
  if (filters.products?.length) record.products = filters.products.join(',');
  if (filters.metric) record.metric = filters.metric;

  return useQuery({
    queryKey: queryKeys.reports.productFairMatrix(record),
    queryFn: async () => {
      const params = new URLSearchParams(record).toString();
      const { data } = await api.get<ApiSuccessResponse<ProductFairMatrixResponse>>(
        `/reports/product-fair-matrix${params ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}
