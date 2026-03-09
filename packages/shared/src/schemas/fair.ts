import { z } from 'zod';

export const createFairSchema = z.object({
  name: z.string().min(1, 'Fuar adı zorunludur'),
  address: z.string().min(1, 'Adres zorunludur'),
  startDate: z.string().datetime({ message: 'Geçerli bir başlangıç tarihi giriniz' }),
  endDate: z.string().datetime({ message: 'Geçerli bir bitiş tarihi giriniz' }),
});

export type CreateFairDto = z.infer<typeof createFairSchema>;

export const updateFairSchema = createFairSchema.partial();

export type UpdateFairDto = z.infer<typeof updateFairSchema>;
