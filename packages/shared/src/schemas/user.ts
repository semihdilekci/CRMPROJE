import { z } from 'zod';
import { ROLES } from '../constants/enums';

const phoneSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim() === '' || /^\+[1-9]\d{9,14}$/.test(v.trim()),
    'Geçerli E.164 formatında giriniz (örn: +905551234567)'
  )
  .transform((v) => (v?.trim() === '' ? undefined : v?.trim()));

export const createUserSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Parola en az 6 karakter olmalıdır'),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Geçersiz rol' }) }).optional(),
  teamId: z.string().min(1, 'Ekip seçimi zorunludur'),
  phone: phoneSchema,
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Geçersiz rol' }) }).optional(),
  password: z.string().min(6, 'Parola en az 6 karakter olmalıdır').optional(),
  teamId: z.string().min(1, 'Ekip seçimi zorunludur').optional(),
  phone: phoneSchema,
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
