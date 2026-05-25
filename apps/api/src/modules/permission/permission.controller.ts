import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiSuccessResponse,
  EffectivePermissions,
  UserPermissionsResponse,
  TeamPermissionsResponse,
  updateUserPermissionsSchema,
  updateTeamPermissionsSchema,
  updateReporterReportsSchema,
  UpdateUserPermissionsDto,
  UpdateTeamPermissionsDto,
  UpdateReporterReportsDto,
  ReporterType,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PermissionService } from './permission.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('me')
  async getMyPermissions(
    @CurrentUser('id') userId: string,
  ): Promise<ApiSuccessResponse<EffectivePermissions>> {
    const data = await this.permissionService.getEffectivePermissions(userId);
    return { success: true, message: 'İzinler başarıyla getirildi', data };
  }

  @Get('users/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUserPermissions(
    @Param('userId') userId: string,
  ): Promise<ApiSuccessResponse<UserPermissionsResponse>> {
    const data = await this.permissionService.getUserPermissions(userId);
    return { success: true, message: 'Kullanıcı izinleri başarıyla getirildi', data };
  }

  @Put('users/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async updateUserPermissions(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserPermissionsSchema)) dto: UpdateUserPermissionsDto,
  ): Promise<ApiSuccessResponse<UserPermissionsResponse>> {
    const data = await this.permissionService.updateUserPermissions(userId, dto);
    return { success: true, message: 'Kullanıcı izinleri başarıyla güncellendi', data };
  }

  @Get('teams/:teamId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getTeamPermissions(
    @Param('teamId') teamId: string,
  ): Promise<ApiSuccessResponse<TeamPermissionsResponse>> {
    const data = await this.permissionService.getTeamPermissions(teamId);
    return { success: true, message: 'Ekip izinleri başarıyla getirildi', data };
  }

  @Put('teams/:teamId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async updateTeamPermissions(
    @Param('teamId') teamId: string,
    @Body(new ZodValidationPipe(updateTeamPermissionsSchema)) dto: UpdateTeamPermissionsDto,
  ): Promise<ApiSuccessResponse<TeamPermissionsResponse>> {
    const data = await this.permissionService.updateTeamPermissions(teamId, dto);
    return { success: true, message: 'Ekip izinleri başarıyla güncellendi', data };
  }

  @Get('reporter-reports')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getReporterReports(): Promise<
    ApiSuccessResponse<{ reporterType: ReporterType; reportSlug: string; enabled: boolean }[]>
  > {
    const data = await this.permissionService.getFullReporterReportMatrix();
    return { success: true, message: 'Rapor görünürlük matrisi başarıyla getirildi', data };
  }

  @Put('reporter-reports')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async updateReporterReports(
    @Body(new ZodValidationPipe(updateReporterReportsSchema)) dto: UpdateReporterReportsDto,
  ): Promise<
    ApiSuccessResponse<{ reporterType: ReporterType; reportSlug: string; enabled: boolean }[]>
  > {
    const data = await this.permissionService.updateReporterReports(dto);
    return { success: true, message: 'Rapor görünürlük ayarları başarıyla güncellendi', data };
  }
}
