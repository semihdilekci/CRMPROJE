import { User } from './user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}
