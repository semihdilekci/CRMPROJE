import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import {
  LoginDto,
  RegisterDto,
  AuthTokenPair,
  LoginSuccess,
  MfaRequiredResponse,
  User,
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

type DbClient = Prisma.TransactionClient | PrismaService;

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

  async register(dto: RegisterDto): Promise<LoginSuccess> {
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

    const tokens = await this.generateTokensForNewSession(user.id, user.role);

    this.logger.log(`User registered: ${user.email}`);

    return { user: this.toUserResponse(user), tokens };
  }

  async login(dto: LoginDto): Promise<LoginSuccess | MfaRequiredResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        ...USER_SELECT,
        password: true,
        failedLoginCount: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-posta veya parola hatalı');
    }

    const now = new Date();
    let failedCount = user.failedLoginCount;
    let lockedUntil = user.lockedUntil;

    if (lockedUntil && lockedUntil <= now) {
      failedCount = 0;
      lockedUntil = null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    if (lockedUntil && lockedUntil > now) {
      const minutesLeft = Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000));
      throw new ForbiddenException(
        `Hesabınız geçici olarak kilitlendi. ${minutesLeft} dakika sonra tekrar deneyin.`
      );
    }

    const passwordValid = await argon2.verify(user.password, dto.password);

    if (!passwordValid) {
      const threshold = await this.getAccountLockoutThreshold();
      const lockMinutes = await this.getAccountLockoutMinutes();
      const newFailed = failedCount + 1;
      const shouldLock = newFailed >= threshold;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailed,
          lockedUntil: shouldLock ? new Date(now.getTime() + lockMinutes * 60_000) : null,
        },
      });
      this.logger.warn(`Failed login attempt for: ${dto.email}`);
      throw new UnauthorizedException('E-posta veya parola hatalı');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const mfaEnabled = (await this.settingsService.get('MFA_SMS_ENABLED')) === 'true';

    if (!mfaEnabled) {
      const tokens = await this.generateTokensForNewSession(user.id, user.role);
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

  async verifyMfa(tempToken: string, code: string): Promise<LoginSuccess> {
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

    const tokens = await this.generateTokensForNewSession(user.id, user.role);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    this.logger.log(`User logged in (MFA verified): ${user.email}`);
    return { user: this.toUserResponse(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokenPair> {
    let payload: { sub: string; rtid?: string };

    try {
      payload = this.jwtService.verify<{ sub: string; rtid?: string }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    if (!payload.rtid) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    const record = await this.prisma.refreshToken.findUnique({
      where: { id: payload.rtid },
    });

    if (!record || record.userId !== payload.sub) {
      throw new UnauthorizedException('Erişim reddedildi');
    }

    if (record.replacedAt) {
      await this.revokeFamilyTokens(record.familyId);
      this.logger.warn(
        `Refresh token reuse detected (rotated token replay), family revoked: ${record.familyId}`
      );
      throw new UnauthorizedException(
        'Oturum güvenlik nedeniyle sonlandırıldı. Lütfen tekrar giriş yapın.'
      );
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    const tokenValid = await argon2.verify(record.tokenHash, refreshToken);

    if (!tokenValid) {
      throw new UnauthorizedException('Erişim reddedildi');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Erişim reddedildi');
    }

    return this.prisma.$transaction(async (tx) => {
      const rotated = await tx.refreshToken.updateMany({
        where: { id: record.id, replacedAt: null },
        data: { replacedAt: new Date() },
      });

      if (rotated.count === 0) {
        throw new UnauthorizedException('Erişim reddedildi');
      }

      return this.persistRefreshTokenPair(user.id, user.role, record.familyId, tx);
    });
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    this.logger.log(`User logged out: ${userId}`);
  }

  private async revokeFamilyTokens(familyId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { familyId } });
  }

  private async generateTokensForNewSession(userId: string, role: string): Promise<AuthTokenPair> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    const familyId = randomUUID();
    return this.persistRefreshTokenPair(userId, role, familyId, this.prisma);
  }

  private async persistRefreshTokenPair(
    userId: string,
    role: string,
    familyId: string,
    db: DbClient
  ): Promise<AuthTokenPair> {
    const id = randomUUID();
    const accessPayload = { sub: userId, role };
    const refreshPayload = { sub: userId, rtid: id };

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

    const decoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const expSec = decoded?.exp;
    if (expSec == null) {
      throw new UnauthorizedException('Refresh token oluşturulamadı');
    }
    const expiresAt = new Date(expSec * 1000);

    const tokenHash = await argon2.hash(refreshToken);

    await db.refreshToken.create({
      data: {
        id,
        userId,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
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

  private async getAccountLockoutThreshold(): Promise<number> {
    const fromEnv = this.configService.get<string>('ACCOUNT_LOCKOUT_THRESHOLD');
    if (fromEnv !== undefined && String(fromEnv).trim() !== '') {
      const n = parseInt(String(fromEnv).trim(), 10);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    const s = await this.settingsService.get('ACCOUNT_LOCKOUT_THRESHOLD');
    const parsed = parseInt(s ?? '5', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }

  private async getAccountLockoutMinutes(): Promise<number> {
    const fromEnv = this.configService.get<string>('ACCOUNT_LOCKOUT_MINUTES');
    if (fromEnv !== undefined && String(fromEnv).trim() !== '') {
      const n = parseInt(String(fromEnv).trim(), 10);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    const s = await this.settingsService.get('ACCOUNT_LOCKOUT_MINUTES');
    const parsed = parseInt(s ?? '15', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
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
