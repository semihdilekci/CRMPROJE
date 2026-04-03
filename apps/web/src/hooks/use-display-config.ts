import { useQuery } from '@tanstack/react-query';
import type { ApiSuccessResponse, DisplayConfig } from '@crm/shared';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const CONFIG_KEY = ['settings', 'config'] as const;

/** Varsayılan para birimi, dönüşüm etiketleri ve arka plan blob ayarları. Oturum yokken istek atılmaz (401 döngüsü önlenir). */
export function useDisplayConfig() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);

  return useQuery({
    queryKey: CONFIG_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<DisplayConfig>>('/settings/config');
      return data.data;
    },
    enabled: isAuthenticated && !authLoading,
  });
}
