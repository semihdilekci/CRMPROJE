import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiSuccessResponse } from '@crm/shared';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('card-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCardImage(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ApiSuccessResponse<{ url: string }>> {
    const url = await this.uploadService.uploadCardImage(file);
    return {
      success: true,
      message: 'Kartvizit fotoğrafı başarıyla yüklendi',
      data: { url },
    };
  }
}
