import { User } from './user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

/** MFA açıkken login başarılı olduğunda dönen yanıt. OTP adımı beklenir. */
export interface MfaRequiredResponse {
  tempToken: string;
  requiresMfa: true;
}

export type LoginOrMfaResponse = LoginResponse | MfaRequiredResponse;

export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}
