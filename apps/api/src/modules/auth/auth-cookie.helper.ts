import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { REFRESH_COOKIE_NAME } from '@crm/shared';

@Injectable()
export class AuthCookieHelper {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  setRefreshCookie(res: Response, refreshToken: string): void {
    const decoded = this.jwtService.decode(refreshToken) as { exp?: number };
    const maxAgeMs =
      decoded?.exp != null
        ? Math.max(0, Math.floor(decoded.exp * 1000 - Date.now()))
        : undefined;

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.isSecure(),
      sameSite: this.getSameSite(),
      path: '/api/v1/auth',
      domain: this.getDomain(),
      ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/api/v1/auth',
      domain: this.getDomain(),
      httpOnly: true,
      secure: this.isSecure(),
      sameSite: this.getSameSite(),
    });
  }

  private getDomain(): string | undefined {
    const d = this.configService.get<string>('COOKIE_DOMAIN')?.trim();
    return d || undefined;
  }

  private isSecure(): boolean {
    return (
      this.configService.get<string>('NODE_ENV') === 'production' ||
      this.configService.get<string>('COOKIE_SECURE') === 'true'
    );
  }

  private getSameSite(): 'strict' | 'lax' | 'none' {
    const raw = this.configService.get<string>('COOKIE_SAMESITE')?.toLowerCase();
    if (raw === 'strict' || raw === 'lax' || raw === 'none') {
      return raw;
    }
    return 'lax';
  }
}
