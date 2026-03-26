import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '@prisma/prisma.service';
import { SettingsService } from '@modules/settings/settings.service';
import { SmsService } from '@modules/sms/sms.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('argon-hash'),
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
    user: { findUnique: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { verify: jest.Mock; signAsync: jest.Mock; decode: jest.Mock };

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
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
    };

    jwtService = {
      verify: jest.fn(),
      signAsync: jest.fn(),
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { getOrThrow: mockConfig } },
        {
          provide: SettingsService,
          useValue: { get: jest.fn().mockResolvedValue('false') },
        },
        { provide: SmsService, useValue: { sendOtp: jest.fn(), verifyOtp: jest.fn() } },
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
