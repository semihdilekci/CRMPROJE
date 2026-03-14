import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { SystemSetting, DisplayConfig } from '@crm/shared';
import { CONVERSION_RATES } from '@crm/shared';

const DEFAULTS: Array<{ key: string; value: string; description: string }> = [
  { key: 'DEFAULT_CURRENCY', value: 'TRY', description: 'Varsayılan para birimi' },
  {
    key: 'CONVERSION_RATE_LABEL_very_high',
    value: 'Çok yüksek (80-100%)',
    description: 'Dönüşüm oranı etiketi',
  },
  {
    key: 'CONVERSION_RATE_LABEL_high',
    value: 'Yüksek (60-80%)',
    description: 'Dönüşüm oranı etiketi',
  },
  {
    key: 'CONVERSION_RATE_LABEL_medium',
    value: 'Orta (40-60%)',
    description: 'Dönüşüm oranı etiketi',
  },
  {
    key: 'CONVERSION_RATE_LABEL_low',
    value: 'Düşük (20-40%)',
    description: 'Dönüşüm oranı etiketi',
  },
  {
    key: 'CONVERSION_RATE_LABEL_very_low',
    value: 'Çok düşük (0-20%)',
    description: 'Dönüşüm oranı etiketi',
  },
  { key: 'MFA_SMS_ENABLED', value: 'false', description: 'SMS OTP açık (true) / kapalı (false)' },
  {
    key: 'RATE_LIMIT_LOGIN_ATTEMPTS',
    value: '5',
    description: 'Login max deneme sayısı (dakika başına)',
  },
  {
    key: 'RATE_LIMIT_LOGIN_WINDOW_MINUTES',
    value: '1',
    description: 'Login rate limit penceresi (dakika)',
  },
  {
    key: 'RATE_LIMIT_MFA_ATTEMPTS',
    value: '5',
    description: 'OTP doğrulama max deneme sayısı',
  },
  {
    key: 'RATE_LIMIT_MFA_WINDOW_MINUTES',
    value: '5',
    description: 'OTP rate limit penceresi (dakika)',
  },
  {
    key: 'RATE_LIMIT_REGISTER_ATTEMPTS',
    value: '3',
    description: 'Kayıt max deneme sayısı (dakika başına)',
  },
  {
    key: 'RATE_LIMIT_REGISTER_WINDOW_MINUTES',
    value: '1',
    description: 'Kayıt rate limit penceresi (dakika)',
  },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureDefaults();
      this.logger.log('Varsayılan sistem ayarları kontrol edildi / oluşturuldu.');
    } catch (err) {
      this.logger.error(
        'Varsayılan ayarlar oluşturulurken hata. Veritabanı migration\'ı uygulandı mı?',
        err
      );
      throw err;
    }
  }

  async ensureDefaults(): Promise<void> {
    for (const d of DEFAULTS) {
      await this.prisma.systemSetting.upsert({
        where: { key: d.key },
        update: {},
        create: { key: d.key, value: d.value, description: d.description },
      });
    }
  }

  async getAll(): Promise<SystemSetting[]> {
    await this.ensureDefaults();
    const list = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return list.map((s) => ({
      key: s.key,
      value: s.value,
      description: s.description,
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async get(key: string): Promise<string | null> {
    const s = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return s?.value ?? null;
  }

  /** Giriş yapmış her kullanıcının okuyabildiği görüntü ayarları (para birimi, etiket metinleri). */
  async getDisplayConfig(): Promise<DisplayConfig> {
    const defaultCurrency = (await this.get('DEFAULT_CURRENCY')) ?? 'TRY';
    const conversionRateLabels: Record<string, string> = {};
    for (const rate of CONVERSION_RATES) {
      const value = await this.get(`CONVERSION_RATE_LABEL_${rate}`);
      conversionRateLabels[rate] = value ?? rate;
    }
    return { defaultCurrency, conversionRateLabels };
  }

  async set(
    key: string,
    value: string,
    description?: string | null,
    auditUser?: { id: string; email: string }
  ): Promise<SystemSetting> {
    const before = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, description: description ?? undefined },
      create: { key, value, description: description ?? undefined },
    });
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'setting',
      entityId: key,
      action: before ? 'update' : 'create',
      before: before ? { value: before.value, description: before.description } : undefined,
      after: { value: updated.value, description: updated.description },
    });
    return {
      key: updated.key,
      value: updated.value,
      description: updated.description,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
