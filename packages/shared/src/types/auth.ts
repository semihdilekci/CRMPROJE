import { User } from './user';

/** Servis katmanı — access + refresh çifti */
export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * API yanıtında dönen token alanı.
 * Web: yalnızca accessToken (refresh httpOnly çerezde).
 * Mobil (client: mobile): refresh Secure Store için body'de de döner.
 */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokensResponse;
}

/** Login/register/verify sonrası servis içi tam çift */
export interface LoginSuccess {
  user: User;
  tokens: AuthTokenPair;
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
