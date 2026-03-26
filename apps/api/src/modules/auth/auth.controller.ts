import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  ApiSuccessResponse,
  LoginResponse,
  MfaRequiredResponse,
  AuthTokensResponse,
  LoginSuccess,
  REFRESH_COOKIE_NAME,
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  verifyMfaSchema,
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  VerifyMfaDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthCookieHelper } from './auth-cookie.helper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieHelper: AuthCookieHelper
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiSuccessResponse<LoginResponse>> {
    const data = await this.authService.register(dto);
    const client = dto.client ?? 'web';
    if (client === 'web') {
      this.authCookieHelper.setRefreshCookie(res, data.tokens.refreshToken);
    }
    return {
      success: true,
      message: 'Kayıt başarılı',
      data: this.toLoginResponse(data, client),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiSuccessResponse<LoginResponse | MfaRequiredResponse>> {
    const data = await this.authService.login(dto);
    const isMfa = 'requiresMfa' in data && data.requiresMfa;
    if (isMfa) {
      return {
        success: true,
        message: 'OTP kodunuz gönderildi',
        data,
      };
    }
    const client = dto.client ?? 'web';
    const success = data as LoginSuccess;
    if (client === 'web') {
      this.authCookieHelper.setRefreshCookie(res, success.tokens.refreshToken);
    }
    return {
      success: true,
      message: 'Giriş başarılı',
      data: this.toLoginResponse(success, client),
    };
  }

  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @UsePipes(new ZodValidationPipe(verifyMfaSchema))
  async verifyMfa(
    @Body() dto: VerifyMfaDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiSuccessResponse<LoginResponse>> {
    const data = await this.authService.verifyMfa(dto.tempToken, dto.code);
    const client = dto.client ?? 'web';
    if (client === 'web') {
      this.authCookieHelper.setRefreshCookie(res, data.tokens.refreshToken);
    }
    return {
      success: true,
      message: 'Giriş başarılı',
      data: this.toLoginResponse(data, client),
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiSuccessResponse<AuthTokensResponse>> {
    const refreshToken = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token gerekli');
    }

    const tokens = await this.authService.refresh(refreshToken);
    const usedBody = Boolean(dto.refreshToken);

    if (usedBody) {
      return {
        success: true,
        message: 'Token yenilendi',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    }

    this.authCookieHelper.setRefreshCookie(res, tokens.refreshToken);
    return {
      success: true,
      message: 'Token yenilendi',
      data: { accessToken: tokens.accessToken },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<ApiSuccessResponse<null>> {
    await this.authService.logout(userId);
    this.authCookieHelper.clearRefreshCookie(res);
    return {
      success: true,
      message: 'Başarıyla çıkış yapıldı',
      data: null,
    };
  }

  private toLoginResponse(data: LoginSuccess, client: 'web' | 'mobile'): LoginResponse {
    if (client === 'mobile') {
      return {
        user: data.user,
        tokens: {
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        },
      };
    }
    return {
      user: data.user,
      tokens: { accessToken: data.tokens.accessToken },
    };
  }
}
