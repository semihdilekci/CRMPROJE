import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import {
  SYSTEM_SECRET_KEYS,
  maskSecret,
  type MaskedSecret,
} from '@crm/shared';
import { decryptSecret, encryptSecret } from './secret-crypto';

const REDACTED = '[REDACTED]';

@Injectable()
export class SecretsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SecretsService.name);
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const encryptionKey = this.config.get<string>('SECRETS_ENCRYPTION_KEY')?.trim();
    if (!encryptionKey) {
      this.logger.warn(
        'SECRETS_ENCRYPTION_KEY tanımlı değil — panelden Gemini API anahtarı kaydedilemez. apps/api/.env dosyasına ekleyin (openssl rand -base64 32) ve API\'yi yeniden başlatın.',
      );
    } else {
      this.logger.log('Secret şifreleme anahtarı yüklendi (panelden Gemini key kaydı aktif).');
    }
    await this.migrateEnvGeminiKeyIfNeeded();
  }

  /** DB secret → env fallback sırasıyla Gemini API anahtarını döner. */
  async getGeminiApiKey(): Promise<string | null> {
    const fromDb = await this.getPlaintext(SYSTEM_SECRET_KEYS.GEMINI_API_KEY);
    if (fromDb) {
      return fromDb;
    }
    const fromEnv = this.config.get<string>('GEMINI_API_KEY')?.trim();
    return fromEnv || null;
  }

  async getGeminiMasked(): Promise<MaskedSecret> {
    const key = SYSTEM_SECRET_KEYS.GEMINI_API_KEY;
    const record = await this.prisma.systemSecret.findUnique({
      where: { key },
      include: { updatedBy: { select: { email: true } } },
    });

    if (record) {
      let preview: string | null = null;
      try {
        const plain = await this.decryptRecord(record.ciphertext);
        preview = maskSecret(plain);
      } catch {
        preview = '****';
      }
      return {
        key,
        isConfigured: true,
        source: 'database',
        maskedPreview: preview,
        updatedAt: record.updatedAt.toISOString(),
        updatedByEmail: record.updatedBy?.email ?? null,
      };
    }

    const envValue = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (envValue) {
      return {
        key,
        isConfigured: true,
        source: 'environment',
        maskedPreview: maskSecret(envValue),
        updatedAt: null,
        updatedByEmail: null,
      };
    }

    return {
      key,
      isConfigured: false,
      source: 'none',
      maskedPreview: null,
      updatedAt: null,
      updatedByEmail: null,
    };
  }

  async setGeminiApiKey(
    value: string,
    currentPassword: string,
    user: { id: string; email: string },
  ): Promise<MaskedSecret> {
    await this.verifyAdminPassword(user.id, currentPassword);
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException('API anahtarı boş olamaz');
    }

    const encryptionKey = this.requireEncryptionKey();
    const ciphertext = encryptSecret(trimmed, encryptionKey);
    const key = SYSTEM_SECRET_KEYS.GEMINI_API_KEY;

    const before = await this.prisma.systemSecret.findUnique({ where: { key } });

    await this.prisma.systemSecret.upsert({
      where: { key },
      update: {
        ciphertext,
        updatedById: user.id,
        description: 'Google Gemini AI analiz API anahtarı',
      },
      create: {
        key,
        ciphertext,
        updatedById: user.id,
        description: 'Google Gemini AI analiz API anahtarı',
      },
    });

    this.cache.set(key, trimmed);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      entityType: 'setting',
      entityId: key,
      action: before ? 'update' : 'create',
      before: before ? { configured: true, value: REDACTED } : undefined,
      after: { configured: true, value: REDACTED },
    });

    return this.getGeminiMasked();
  }

  async clearGeminiApiKey(
    currentPassword: string,
    user: { id: string; email: string },
  ): Promise<MaskedSecret> {
    await this.verifyAdminPassword(user.id, currentPassword);
    const key = SYSTEM_SECRET_KEYS.GEMINI_API_KEY;
    const before = await this.prisma.systemSecret.findUnique({ where: { key } });

    if (before) {
      await this.prisma.systemSecret.delete({ where: { key } });
      this.cache.delete(key);

      await this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        entityType: 'setting',
        entityId: key,
        action: 'delete',
        before: { configured: true, value: REDACTED },
        after: { configured: false, value: REDACTED },
      });
    }

    return this.getGeminiMasked();
  }

  private async getPlaintext(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const record = await this.prisma.systemSecret.findUnique({ where: { key } });
    if (!record) {
      return null;
    }

    try {
      const plain = await this.decryptRecord(record.ciphertext);
      this.cache.set(key, plain);
      return plain;
    } catch (err) {
      this.logger.error(`Secret decrypt failed for ${key}`, err);
      return null;
    }
  }

  private async decryptRecord(ciphertext: string): Promise<string> {
    const encryptionKey = this.requireEncryptionKey();
    return decryptSecret(ciphertext, encryptionKey);
  }

  private requireEncryptionKey(): string {
    const key = this.config.get<string>('SECRETS_ENCRYPTION_KEY')?.trim();
    if (!key) {
      throw new InternalServerErrorException(
        'Secret şifreleme anahtarı yapılandırılmamış. SECRETS_ENCRYPTION_KEY env değişkenini tanımlayın (openssl rand -base64 32).',
      );
    }
    return key;
  }

  private async verifyAdminPassword(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, role: true },
    });
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır');
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      throw new ForbiddenException('Parola doğrulanamadı');
    }
  }

  /** İlk kurulum: env'deki key DB'ye taşınır (SECRETS_ENCRYPTION_KEY varsa). */
  private async migrateEnvGeminiKeyIfNeeded(): Promise<void> {
    const key = SYSTEM_SECRET_KEYS.GEMINI_API_KEY;
    const existing = await this.prisma.systemSecret.findUnique({ where: { key } });
    if (existing) {
      return;
    }

    const envValue = this.config.get<string>('GEMINI_API_KEY')?.trim();
    const encryptionKey = this.config.get<string>('SECRETS_ENCRYPTION_KEY')?.trim();
    if (!envValue || !encryptionKey) {
      return;
    }

    try {
      const ciphertext = encryptSecret(envValue, encryptionKey);
      await this.prisma.systemSecret.create({
        data: {
          key,
          ciphertext,
          description: 'Google Gemini AI analiz API anahtarı (env migrasyonu)',
        },
      });
      this.cache.set(key, envValue);
      this.logger.log('GEMINI_API_KEY env değerinden veritabanına taşındı.');
    } catch (err) {
      this.logger.warn('GEMINI_API_KEY env migrasyonu başarısız', err);
    }
  }
}
