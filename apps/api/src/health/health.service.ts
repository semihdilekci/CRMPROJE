import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      this.logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          service: 'api',
          env: process.env.NODE_ENV ?? 'development',
          message: 'Readiness check failed: database unreachable',
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      throw new ServiceUnavailableException(
        'Veritabanına şu an bağlanılamıyor. Lütfen daha sonra tekrar deneyin.',
      );
    }
  }
}
