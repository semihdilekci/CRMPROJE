import { z } from 'zod';
import { CONVERSION_RATES, CURRENCIES } from '../constants/enums';

export const createCustomerSchema = z.object({
  company: z.string().min(1, 'Firma adı zorunludur'),
  name: z.string().min(1, 'Ad soyad zorunludur'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').nullable().optional(),
  budgetRaw: z.string().nullable().optional(),
  budgetCurrency: z.enum(CURRENCIES).nullable().optional(),
  conversionRate: z.enum(CONVERSION_RATES).nullable().optional(),
  products: z.array(z.string()).optional().default([]),
  cardImage: z.string().nullable().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
