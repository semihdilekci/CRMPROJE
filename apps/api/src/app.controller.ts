import { Controller, Get } from '@nestjs/common';
import { ApiSuccessResponse } from '@crm/shared';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): ApiSuccessResponse<{ status: string }> {
    return {
      success: true,
      message: 'API is running',
      data: { status: 'ok' },
    };
  }
}
