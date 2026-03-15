import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiSuccessResponse } from '@crm/shared';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { SettingsService } from '@modules/settings/settings.service';
import { OfferService } from '@modules/opportunity/offer.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly settingsService: SettingsService,
    private readonly offerService: OfferService,
  ) {}

  @Get('teklif-template/default')
  async downloadDefaultTeklifTemplate(@Res({ passthrough: true }) res: Response) {
    const buffer = this.uploadService.getDefaultTeklifTemplateBuffer();
    if (!buffer) {
      throw new NotFoundException('Varsayılan teklif template bulunamadı');
    }
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="default-teklif-template.docx"',
    });
    return new StreamableFile(buffer);
  }

  @Post('card-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCardImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiSuccessResponse<{ url: string }>> {
    const url = await this.uploadService.uploadCardImage(file);
    return {
      success: true,
      message: 'Kartvizit fotoğrafı başarıyla yüklendi',
      data: { url },
    };
  }

  @Post('teklif-template-reset')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async resetTeklifTemplateToDefault(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<{ path: string }>> {
    const defaultPath = 'assets/teklif-templates/default-teklif-template.docx';
    await this.settingsService.set(
      'TEKLIF_TEMPLATE_URL',
      defaultPath,
      'Teklif template dosya yolu',
      { id: user.id, email: user.email },
    );
    this.offerService.invalidateTemplateCache();
    return {
      success: true,
      message: 'Teklif template varsayılana döndürüldü',
      data: { path: defaultPath },
    };
  }

  @Post('teklif-template')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTeklifTemplate(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<{ path: string }>> {
    const relativePath = await this.uploadService.uploadTeklifTemplate(file);
    await this.settingsService.set(
      'TEKLIF_TEMPLATE_URL',
      relativePath,
      'Teklif template dosya yolu',
      { id: user.id, email: user.email },
    );
    this.offerService.invalidateTemplateCache();
    return {
      success: true,
      message: 'Teklif template başarıyla yüklendi',
      data: { path: relativePath },
    };
  }
}
