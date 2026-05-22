import { z } from 'zod';

export const createCustomerContactSchema = z.object({
  name: z.string().min(1, 'Ad soyad zorunludur'),
  phone: z.string().nullable().optional(),
  email: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(val),
      { message: 'Geçerli bir e-posta adresi giriniz' },
    ),
  cardImage: z.string().nullable().optional(),
});

export type CreateCustomerContactDto = z.infer<typeof createCustomerContactSchema>;

export const updateCustomerContactSchema = createCustomerContactSchema.partial();

export type UpdateCustomerContactDto = z.infer<typeof updateCustomerContactSchema>;

export const createCustomerWithContactSchema = z.object({
  company: z.string().min(1, 'Firma adı zorunludur'),
  address: z.string().nullable().optional(),
  contact: createCustomerContactSchema.optional(),
});

export type CreateCustomerWithContactDto = z.infer<typeof createCustomerWithContactSchema>;
