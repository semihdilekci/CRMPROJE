import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import type { SystemSetting } from '@crm/shared';

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
];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

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
