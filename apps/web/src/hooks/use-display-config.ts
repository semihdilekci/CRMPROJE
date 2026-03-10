import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, DisplayConfig } from '@crm/shared';
import api from '@/lib/api';

const CONFIG_KEY = ['settings', 'config'] as const;

/** Varsayılan para birimi ve dönüşüm oranı etiketleri (Sistem Ayarlarından). Giriş yapmış herkes kullanabilir. */
export function useDisplayConfig() {
  return useQuery({
    queryKey: CONFIG_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<DisplayConfig>>('/settings/config');
      return data.data;
    },
  });
}
