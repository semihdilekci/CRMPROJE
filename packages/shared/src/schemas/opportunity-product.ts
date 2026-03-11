import { z } from 'zod';

export const opportunityProductItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive().nullable().optional(),
  unit: z.enum(['ton', 'kg', 'adet']).optional().default('ton'),
  note: z.string().nullable().optional(),
});

export const opportunityProductsSchema = z
  .array(opportunityProductItemSchema)
  .optional()
  .default([]);

