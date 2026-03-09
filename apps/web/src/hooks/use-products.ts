import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccessResponse, Product, CreateProductDto, UpdateProductDto } from '@crm/shared';
import api from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useProducts(search?: string) {
  const searchNorm = (typeof search === 'string' ? search.trim() : '') || '';
  return useQuery({
    queryKey: ['products', 'list', searchNorm],
    queryFn: async ({ queryKey }) => {
      const s = queryKey[2] as string;
      const params = s ? `?search=${encodeURIComponent(s)}` : '';
      const { data } = await api.get<ApiSuccessResponse<Product[]>>(`/products${params}`);
      return data.data;
    },
  });
}

export function useProductCustomerCount(id: string | null) {
  return useQuery({
    queryKey: ['products', id, 'customer-count'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<{ count: number }>>(
        `/products/${id}/customer-count`
      );
      return data.data.count;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const { data } = await api.post<ApiSuccessResponse<Product>>('/products', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProductDto }) => {
      const { data } = await api.patch<ApiSuccessResponse<Product>>(`/products/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
