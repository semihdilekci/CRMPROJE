import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiSuccessResponse } from '@crm/shared';
import type { SystemSetting, DisplayConfig } from '@crm/shared';
import { SetSettingDto, setSettingSchema } from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** Giriş yapmış herkesin okuyabildiği görüntü config (varsayılan para birimi, dönüşüm oranı etiketleri). */
  @Get('config')
  async getDisplayConfig(): Promise<ApiSuccessResponse<DisplayConfig>> {
    const data = await this.settingsService.getDisplayConfig();
    return { success: true, message: 'Config getirildi', data };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAll(): Promise<ApiSuccessResponse<SystemSetting[]>> {
    const data = await this.settingsService.getAll();
    return { success: true, message: 'Ayarlar getirildi', data };
  }

  @Get(':key')
  async get(@Param('key') key: string): Promise<ApiSuccessResponse<{ value: string | null }>> {
    const value = await this.settingsService.get(key);
    return { success: true, message: 'Ayar getirildi', data: { value } };
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async set(
    @Body(new ZodValidationPipe(setSettingSchema)) dto: SetSettingDto,
    @CurrentUser() user: { id: string; email: string }
  ): Promise<ApiSuccessResponse<SystemSetting>> {
    const data = await this.settingsService.set(
      dto.key,
      dto.value,
      dto.description,
      { id: user.id, email: user.email }
    );
    return { success: true, message: 'Ayar kaydedildi', data };
  }
}
