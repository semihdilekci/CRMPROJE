import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, Product } from '@crm/shared';
import api from '@/lib/api';

export function useProducts(search?: string) {
  const searchNorm = (typeof search === 'string' ? search.trim() : '') || '';
  return useQuery({
    queryKey: ['products', 'list', searchNorm],
    queryFn: async () => {
      const params = searchNorm ? `?search=${encodeURIComponent(searchNorm)}` : '';
      const { data } = await api.get<ApiSuccessResponse<Product[]>>(
        `/products${params}`
      );
      return data.data;
    },
  });
}
