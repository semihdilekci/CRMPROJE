import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiSuccessResponse,
  MaskedSecret,
  SetGeminiSecretDto,
  ClearGeminiSecretDto,
} from '@crm/shared';
import api from '@/lib/api';

const GEMINI_SECRET_KEY = ['admin', 'secrets', 'gemini'] as const;

export function useGeminiSecret() {
  return useQuery({
    queryKey: GEMINI_SECRET_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<MaskedSecret>>(
        '/admin/secrets/gemini',
      );
      return data.data;
    },
  });
}

export function useSetGeminiSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: SetGeminiSecretDto) => {
      const { data } = await api.put<ApiSuccessResponse<MaskedSecret>>(
        '/admin/secrets/gemini',
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GEMINI_SECRET_KEY });
    },
  });
}

export function useClearGeminiSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ClearGeminiSecretDto) => {
      const { data } = await api.delete<ApiSuccessResponse<MaskedSecret>>(
        '/admin/secrets/gemini',
        { data: dto },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GEMINI_SECRET_KEY });
    },
  });
}
