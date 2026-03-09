import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur'),
  description: z.string().nullable().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur').optional(),
  description: z.string().nullable().optional(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
