import { z } from 'zod';

export const setGeminiSecretSchema = z.object({
  value: z.string().trim().min(1, 'API anahtarı zorunludur'),
  currentPassword: z.string().min(1, 'Parola zorunludur'),
});

export type SetGeminiSecretDto = z.infer<typeof setGeminiSecretSchema>;

export const clearGeminiSecretSchema = z.object({
  currentPassword: z.string().min(1, 'Parola zorunludur'),
});

export type ClearGeminiSecretDto = z.infer<typeof clearGeminiSecretSchema>;
