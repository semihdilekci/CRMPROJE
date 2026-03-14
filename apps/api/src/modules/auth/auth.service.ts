import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  LoginDto,
  RegisterDto,
  AuthTokens,
  LoginResponse,
  MfaRequiredResponse,
  User,
  JwtPayload,
} from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { SettingsService } from '@modules/settings/settings.service';
import { SmsService } from '@modules/sms/sms.service';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly smsService: SmsService
  ) {}

  async register(dto: RegisterDto): Promise<LoginResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
      select: USER_SELECT,
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return { user: this.toUserResponse(user), tokens };
  }

  async login(dto: LoginDto): Promise<LoginResponse | MfaRequiredResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...USER_SELECT, password: true },
    });

    if (!user) {
      throw new UnauthorizedException('E-posta veya parola hatalı');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);

    if (!passwordValid) {
      this.logger.warn(`Failed login attempt for: ${dto.email}`);
      throw new UnauthorizedException('E-posta veya parola hatalı');
    }

    const mfaEnabled = (await this.settingsService.get('MFA_SMS_ENABLED')) === 'true';

    if (!mfaEnabled) {
      const tokens = await this.generateTokens(user.id, user.role);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
      this.logger.log(`User logged in: ${user.email}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- password excluded from response
      const { password: _pw, ...userWithoutPassword } = user;
      return { user: this.toUserResponse(userWithoutPassword), tokens };
    }

    const phone = user.phone?.trim();
    if (!phone) {
      throw new UnauthorizedException(
        'Telefon numaranız kayıtlı değil. Yöneticinize başvurun.'
      );
    }

    await this.smsService.sendOtp(phone);
    const tempToken = await this.generateTempToken(user.id);
    this.logger.log(`MFA OTP sent to ${user.email}`);
    return { tempToken, requiresMfa: true };
  }

  async verifyMfa(tempToken: string, code: string): Promise<LoginResponse> {
    let payload: { sub: string; mfa: boolean };

    try {
      payload = this.jwtService.verify<{ sub: string; mfa: boolean }>(tempToken, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın.'
      );
    }

    if (!payload.mfa) {
      throw new UnauthorizedException(
        'Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın.'
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: USER_SELECT,
    });

    if (!user || !user.phone?.trim()) {
      throw new UnauthorizedException(
        'Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın.'
      );
    }

    const valid = await this.smsService.verifyOtp(user.phone.trim(), code);
    if (!valid) {
      throw new UnauthorizedException(
        'Geçersiz veya süresi dolmuş kod. Lütfen tekrar giriş yapın.'
      );
    }

    const tokens = await this.generateTokens(user.id, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    this.logger.log(`User logged in (MFA verified): ${user.email}`);
    return { user: this.toUserResponse(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, hashedRefreshToken: true },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Erişim reddedildi');
    }

    const tokenValid = await argon2.verify(user.hashedRefreshToken, refreshToken);

    if (!tokenValid) {
      throw new UnauthorizedException('Erişim reddedildi');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  private async generateTempToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, mfa: true },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '5m',
      }
    );
  }

  private async generateTokens(userId: string, role: string): Promise<AuthTokens> {
    const accessPayload = { sub: userId, role };
    const refreshPayload = { sub: userId };

    const accessExpiration = this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRATION');
    const refreshExpiration = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRATION');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JWT signAsync expiresIn expects ms.StringValue, config returns string
        expiresIn: accessExpiration as any,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JWT signAsync expiresIn expects ms.StringValue, config returns string
        expiresIn: refreshExpiration as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as User['role'],
      phone: user.phone ?? null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }
}
