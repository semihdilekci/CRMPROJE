import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiSuccessResponse } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';

@Controller()
@SkipThrottle()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  getHealth(): ApiSuccessResponse<{ status: string }> {
    return {
      success: true,
      message: 'API is running',
      data: { status: 'ok' },
    };
  }

  /**
   * Readiness: CRM veritabanına erişim (Blackbox ve yük dengeleyici için).
   */
  @Get('health/ready')
  async getHealthReady(): Promise<ApiSuccessResponse<{ status: string }>> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        success: true,
        message: 'API is ready',
        data: { status: 'ready' },
      };
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
