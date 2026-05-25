import { Controller, Get, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiSuccessResponse,
  clearGeminiSecretSchema,
  setGeminiSecretSchema,
  type ClearGeminiSecretDto,
  type MaskedSecret,
  type SetGeminiSecretDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SecretsService } from './secrets.service';

@Controller('admin/secrets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Get('gemini')
  async getGemini(): Promise<ApiSuccessResponse<MaskedSecret>> {
    const data = await this.secretsService.getGeminiMasked();
    return { success: true, message: 'Gemini API anahtarı bilgisi getirildi', data };
  }

  @Put('gemini')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async setGemini(
    @Body(new ZodValidationPipe(setGeminiSecretSchema)) dto: SetGeminiSecretDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<MaskedSecret>> {
    const data = await this.secretsService.setGeminiApiKey(
      dto.value,
      dto.currentPassword,
      user,
    );
    return { success: true, message: 'Gemini API anahtarı kaydedildi', data };
  }

  @Delete('gemini')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async clearGemini(
    @Body(new ZodValidationPipe(clearGeminiSecretSchema)) dto: ClearGeminiSecretDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<MaskedSecret>> {
    const data = await this.secretsService.clearGeminiApiKey(
      dto.currentPassword,
      user,
    );
    return { success: true, message: 'Gemini API anahtarı silindi', data };
  }
}
