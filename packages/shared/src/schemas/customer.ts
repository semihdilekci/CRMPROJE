import { z } from 'zod';

export const createCustomerSchema = z.object({
  company: z.string().min(1, 'Firma adı zorunludur'),
  name: z.string().min(1, 'Ad soyad zorunludur'),
  address: z.string().nullable().optional(),
  phone: z.string().min(1, 'Telefon zorunludur'),
  email: z.string().email('E-posta formatı geçersizdir.'),
  cardImage: z.string().nullable().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
