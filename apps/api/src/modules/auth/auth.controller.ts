import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiSuccessResponse,
  LoginResponse,
  MfaRequiredResponse,
  AuthTokens,
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto): Promise<ApiSuccessResponse<LoginResponse>> {
    const data = await this.authService.register(dto);
    return {
      success: true,
      message: 'Kayıt başarılı',
      data,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto
  ): Promise<ApiSuccessResponse<LoginResponse | MfaRequiredResponse>> {
    const data = await this.authService.login(dto);
    const isMfa = 'requiresMfa' in data && data.requiresMfa;
    return {
      success: true,
      message: isMfa ? 'OTP kodunuz gönderildi' : 'Giriş başarılı',
      data,
    };
  }

  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @UsePipes(new ZodValidationPipe(verifyMfaSchema))
  async verifyMfa(
    @Body() dto: VerifyMfaDto
  ): Promise<ApiSuccessResponse<LoginResponse>> {
    const data = await this.authService.verifyMfa(dto.tempToken, dto.code);
    return {
      success: true,
      message: 'Giriş başarılı',
      data,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() dto: RefreshTokenDto): Promise<ApiSuccessResponse<AuthTokens>> {
    const data = await this.authService.refresh(dto.refreshToken);
    return {
      success: true,
      message: 'Token yenilendi',
      data,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser('id') userId: string): Promise<ApiSuccessResponse<null>> {
    await this.authService.logout(userId);
    return {
      success: true,
      message: 'Başarıyla çıkış yapıldı',
      data: null,
    };
  }
}
