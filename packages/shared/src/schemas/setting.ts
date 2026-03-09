import { z } from 'zod';

export const setSettingSchema = z.object({
  key: z.string().min(1, 'Key zorunludur'),
  value: z.string(),
  description: z.string().nullable().optional(),
});

export type SetSettingDto = z.infer<typeof setSettingSchema>;
