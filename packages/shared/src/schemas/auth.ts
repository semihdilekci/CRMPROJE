import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Parola en az 6 karakter olmalıdır'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Parola en az 6 karakter olmalıdır'),
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token zorunludur'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
