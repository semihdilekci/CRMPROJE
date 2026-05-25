import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiSuccessResponse } from '@crm/shared';
import { HealthService } from './health/health.service';

@Controller()
@SkipThrottle()
export class AppController {
  constructor(private readonly healthService: HealthService) {}

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
    await this.healthService.checkDatabaseConnection();
    return {
      success: true,
      message: 'API is ready',
      data: { status: 'ready' },
    };
  }
}
