import { z } from 'zod';
import { ROLES } from '../constants/enums';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Geçersiz rol' }) }).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
