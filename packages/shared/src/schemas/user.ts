import { z } from 'zod';
import { ROLES } from '../constants/enums';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Parola en az 6 karakter olmalıdır'),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Geçersiz rol' }) }).optional(),
  teamId: z.string().min(1, 'Ekip seçimi zorunludur'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Geçersiz rol' }) }).optional(),
  password: z.string().min(6, 'Parola en az 6 karakter olmalıdır').optional(),
  teamId: z.string().min(1, 'Ekip seçimi zorunludur').optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
