import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiSuccessResponse, ChatQueryResponse, chatQuerySchema, ChatQueryInput } from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(chatQuerySchema))
  async query(
    @Body() dto: ChatQueryInput,
    @CurrentUser('id') userId: string,
  ): Promise<ApiSuccessResponse<ChatQueryResponse>> {
    const data = await this.chatService.query(userId, dto);
    return {
      success: true,
      message: 'Analiz tamamlandı',
      data,
    };
  }

  @Get('export/:exportId')
  async getExport(
    @Param('exportId') exportId: string,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { filePath, fileName } = await this.chatService.getExport(exportId, userId);
    res.download(filePath, fileName);
  }
}
