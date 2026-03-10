import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccessResponse, SystemSetting, SetSettingDto } from '@crm/shared';
import api from '@/lib/api';

const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccessResponse<SystemSetting[]>>('/settings');
      return data.data;
    },
  });
}

export function useSetSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: SetSettingDto) => {
      const { data } = await api.patch<ApiSuccessResponse<SystemSetting>>('/settings', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: ['settings', 'config'] });
    },
  });
}
