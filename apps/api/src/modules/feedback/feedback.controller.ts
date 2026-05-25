import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiSuccessResponse,
  CreateFeedbackDto,
  Feedback,
  createFeedbackSchema,
  feedbackListQuerySchema,
  FeedbackListQueryDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { FeedbackService, FeedbackListResult } from './feedback.service';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(
    @Body(new ZodValidationPipe(createFeedbackSchema)) dto: CreateFeedbackDto,
    @CurrentUser() user: { id: string },
  ): Promise<ApiSuccessResponse<Feedback>> {
    const data = await this.feedbackService.create(user.id, dto);
    return {
      success: true,
      message: 'Geri bildiriminiz alındı. Teşekkür ederiz.',
      data,
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(
    @Query(new ZodValidationPipe(feedbackListQuerySchema)) query: FeedbackListQueryDto,
  ): Promise<ApiSuccessResponse<Feedback[]> & { meta: FeedbackListResult['meta'] }> {
    const result = await this.feedbackService.findAll(query);
    return {
      success: true,
      message: 'Geri bildirimler getirildi',
      data: result.data,
      meta: result.meta,
    };
  }
}
