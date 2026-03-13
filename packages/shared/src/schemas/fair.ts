import { z } from 'zod';

const baseFairSchema = z.object({
  name: z.string().min(1, 'Fuar adı zorunludur'),
  address: z.string().optional().default(''),
  startDate: z.string().datetime({ message: 'Geçerli bir başlangıç tarihi giriniz' }),
  endDate: z.string().datetime({ message: 'Geçerli bir bitiş tarihi giriniz' }),
  targetBudget: z.string().nullable().optional(),
  targetTonnage: z.number().positive().nullable().optional(),
  targetLeadCount: z.number().int().positive().nullable().optional(),
});

export const createFairSchema = baseFairSchema;

export type CreateFairDto = z.infer<typeof createFairSchema>;

export const updateFairSchema = baseFairSchema.partial();

export type UpdateFairDto = z.infer<typeof updateFairSchema>;
