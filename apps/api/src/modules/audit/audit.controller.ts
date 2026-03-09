import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiSuccessResponse } from '@crm/shared';
import type { AuditLogEntry } from '@crm/shared';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditService } from './audit.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string
  ): Promise<ApiSuccessResponse<AuditLogEntry[]>> {
    const data = await this.auditService.findAll({
      from,
      to,
      userId,
      entityType,
    });
    return {
      success: true,
      message: 'İşlem geçmişi getirildi',
      data,
    };
  }
}
