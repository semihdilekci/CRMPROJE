import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL');
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `PostgreSQL bağlantısı kurulamadı: ${detail}. Yerel geliştirme: DATABASE_URL örn. postgresql://crm_dev:crm_dev@localhost:5433/crm_dev (npm run db:dev:up). Uzak RDS: güvenlik grubu, VPN ve sslmode. Bkz. apps/api/.env.example ve docs/environment-setup.md.`
      );
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }
}
