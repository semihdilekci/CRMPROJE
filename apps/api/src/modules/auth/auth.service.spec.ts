import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { StructuredLogService } from '@common/logging/structured-log.service';
import { PrismaService } from '@prisma/prisma.service';
import { SettingsService } from '@modules/settings/settings.service';
import { SmsService } from '@modules/sms/sms.service';

/** Yalnızca unit test sabitleri — prod sırları değildir (Fortify hardcoded password). */
const MOCK_PRISMA_USER_PASSWORD_HASH =
  'fixture_prisma_user_password_column_stored_hash_stub';
const LOGIN_PLAINTEXT_LOCKOUT_CASE =
  'fixture_plaintext_lockout_branch_7a8b9c0d1e2f345678901234567890ab';
const LOGIN_PLAINTEXT_VERIFY_FAIL =
  'fixture_plaintext_wrong_password_verify_fail_c0ffee00deadbeef';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('fixture_argon2_hash_fn_return_not_a_secret'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    refreshToken: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let settingsGet: jest.Mock;
  let jwtService: { verify: jest.Mock; signAsync: jest.Mock; decode: jest.Mock };
  let structuredLogWrite: jest.Mock;

  const mockConfig = (key: string) => {
    const map: Record<string, string> = {
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
    };
    return map[key];
  };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
    };

    jwtService = {
      verify: jest.fn(),
      signAsync: jest.fn(),
      decode: jest.fn(),
    };

    structuredLogWrite = jest.fn();
    const structuredLog = {
      writeLine: structuredLogWrite,
      baseFields: jest.fn().mockReturnValue({
        timestamp: '2026-01-01T00:00:00.000Z',
        service: 'api',
        env: 'test',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: mockConfig,
            get: jest.fn().mockReturnValue(undefined),
          },
        },
        {
          provide: SettingsService,
          useFactory: () => {
            settingsGet = jest.fn().mockImplementation(async (key: string) => {
              if (key === 'MFA_SMS_ENABLED') return 'false';
              if (key === 'ACCOUNT_LOCKOUT_THRESHOLD') return '5';
              if (key === 'ACCOUNT_LOCKOUT_MINUTES') return '15';
              return null;
            });
            return { get: settingsGet };
          },
        },
        { provide: SmsService, useValue: { sendOtp: jest.fn(), verifyOtp: jest.fn() } },
        { provide: StructuredLogService, useValue: structuredLog },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    (argon2.verify as jest.Mock).mockResolvedValue(true);
  });

  describe('refresh', () => {
    it('Geçersiz JWT için Unauthorized fırlatır', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rtid yoksa Unauthorized fırlatır', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('Yenilenmiş (replacedAt dolu) token ile reuse: aile iptal ve Unauthorized', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', rtid: 'rt-1' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        familyId: 'fam-1',
        tokenHash: 'hash',
        replacedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.refresh('valid-jwt')).rejects.toThrow(
        'Oturum güvenlik nedeniyle sonlandırıldı'
      );

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { familyId: 'fam-1' },
      });
    });

    it('Eşzamanlı yenileme: updateMany count 0 ise Unauthorized (aile iptali yok)', async () => {
      const future = new Date(Date.now() + 60_000);
      jwtService.verify.mockReturnValue({ sub: 'user-1', rtid: 'rt-1' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        familyId: 'fam-1',
        tokenHash: 'hash',
        replacedAt: null,
        expiresAt: future,
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user' });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.refresh('valid-jwt')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalledWith({
        where: { familyId: 'fam-1' },
      });
    });
  });

  describe('login — hesap kilidi', () => {
    const baseUser = {
      id: 'user-1',
      email: 'u@test.com',
      password: MOCK_PRISMA_USER_PASSWORD_HASH,
      name: 'Test',
      role: 'user',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null as Date | null,
    };

    beforeEach(() => {
      jwtService.signAsync.mockResolvedValue('jwt-token');
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});
    });

    it('lockedUntil gelecekteyse ForbiddenException', async () => {
      const until = new Date(Date.now() + 15 * 60_000);
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        failedLoginCount: 5,
        lockedUntil: until,
      });

      await expect(
        service.login({
          email: 'u@test.com',
          password: LOGIN_PLAINTEXT_LOCKOUT_CASE,
          client: 'web',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('yanlış parolada eşik aşılırsa kilitlenir ve Unauthorized', async () => {
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        failedLoginCount: 4,
        lockedUntil: null,
      });

      await expect(
        service.login({
          email: 'u@test.com',
          password: LOGIN_PLAINTEXT_VERIFY_FAIL,
          client: 'web',
        })
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          failedLoginCount: 5,
          lockedUntil: expect.any(Date),
        }),
      });
      expect(structuredLogWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          logCategory: 'security',
          event: 'auth.login.failure',
          userId: 'user-1',
          outcome: 'failure',
        }),
      );
    });
  });

  describe('logout', () => {
    it('Kullanıcının tüm refresh token kayıtlarını siler', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.logout('user-1');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
