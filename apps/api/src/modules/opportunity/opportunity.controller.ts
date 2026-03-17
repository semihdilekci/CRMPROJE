import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiSuccessResponse,
  OpportunityWithDetails,
  createOpportunitySchema,
  updateOpportunitySchema,
  stageTransitionSchema,
  updateStageLogSchema,
  createOfferSchema,
  createOpportunityNoteSchema,
  updateOpportunityNoteSchema,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ConversionRate,
  type StageTransitionInput,
  type UpdateStageLogInput,
  type CreateOfferInput,
  type CreateOpportunityNoteInput,
  type UpdateOpportunityNoteInput,
  type OpportunityNote,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { OpportunityService } from './opportunity.service';
import { OfferService } from './offer.service';

type StageLogResponse = {
  id: string;
  opportunityId: string;
  stage: string;
  note: string | null;
  lossReason: string | null;
  createdAt: string;
  changedBy: { id: string; name: string; email: string };
};

@Controller()
@UseGuards(JwtAuthGuard)
export class OpportunityController {
  constructor(
    private readonly opportunityService: OpportunityService,
    private readonly offerService: OfferService,
  ) {}

  @Post('fairs/:fairId/opportunities')
  async create(
    @Param('fairId') fairId: string,
    @Body(new ZodValidationPipe(createOpportunitySchema)) dto: CreateOpportunityDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<OpportunityWithDetails>> {
    const data = await this.opportunityService.create(fairId, dto, user);
    return { success: true, message: 'Fırsat başarıyla oluşturuldu', data };
  }

  @Get('fairs/:fairId/opportunities')
  async findByFair(
    @Param('fairId') fairId: string,
    @Query('search') search?: string,
    @Query('conversionRate') conversionRate?: ConversionRate,
    @Query('currentStage') currentStage?: string,
  ): Promise<ApiSuccessResponse<OpportunityWithDetails[]>> {
    const data = await this.opportunityService.findByFair(
      fairId,
      search,
      conversionRate,
      currentStage,
    );
    return { success: true, message: 'Fırsatlar başarıyla getirildi', data };
  }

  @Get('fairs/:fairId/pipeline-stats')
  async getPipelineStats(
    @Param('fairId') fairId: string,
  ): Promise<
    ApiSuccessResponse<{
      byStage: Record<string, number>;
      openTotal: number;
      wonCount: number;
      lostCount: number;
    }>
  > {
    const data = await this.opportunityService.getPipelineStats(fairId);
    return { success: true, message: 'Pipeline istatistikleri getirildi', data };
  }

  @Post('opportunities/:id/transition')
  async transitionStage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(stageTransitionSchema)) dto: StageTransitionInput,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<OpportunityWithDetails>> {
    const data = await this.opportunityService.transitionStage(id, dto, user);
    return { success: true, message: 'Aşama güncellendi', data };
  }

  @Get('opportunities/:id/stages')
  async getStageHistory(
    @Param('id') id: string,
  ): Promise<
    ApiSuccessResponse<StageLogResponse[]>
  > {
    const data = await this.opportunityService.getStageHistory(id);
    return { success: true, message: 'Aşama geçmişi getirildi', data };
  }

  @Patch('opportunities/:id/stages/:logId')
  async updateStageLog(
    @Param('id') id: string,
    @Param('logId') logId: string,
    @Body(new ZodValidationPipe(updateStageLogSchema)) dto: UpdateStageLogInput,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<StageLogResponse[]>> {
    const data = await this.opportunityService.updateStageLog(id, logId, dto, user);
    return { success: true, message: 'Aşama kaydı güncellendi', data };
  }

  @Delete('opportunities/:id/stages/:logId')
  @HttpCode(HttpStatus.OK)
  async deleteLastStageLog(
    @Param('id') id: string,
    @Param('logId') logId: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<StageLogResponse[]>> {
    const data = await this.opportunityService.deleteLastStageLog(id, logId, user);
    return { success: true, message: 'Son aşama kaydı silindi', data };
  }

  @Patch('opportunities/:id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOpportunitySchema)) dto: UpdateOpportunityDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<OpportunityWithDetails>> {
    const data = await this.opportunityService.update(id, dto, user);
    return { success: true, message: 'Fırsat başarıyla güncellendi', data };
  }

  @Post('opportunities/:id/create-offer')
  async createOffer(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createOfferSchema)) dto: CreateOfferInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, format, filename } =
      await this.offerService.createOffer(id, dto);
    const mime =
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('opportunities/:id/has-offer')
  async hasOfferDocument(
    @Param('id') id: string,
  ): Promise<ApiSuccessResponse<{ hasOffer: boolean }>> {
    const hasOffer = await this.offerService.hasOfferDocument(id);
    return {
      success: true,
      message: hasOffer ? 'Teklif mevcut' : 'Teklif yok',
      data: { hasOffer },
    };
  }

  @Get('opportunities/:id/offer-document')
  async getOfferDocument(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.offerService.getOfferDocument(id);
    if (!result) {
      throw new NotFoundException('Teklif dokümanı bulunamadı');
    }
    const mime =
      result.format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return new StreamableFile(result.buffer);
  }

  @Delete('opportunities/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<null>> {
    await this.opportunityService.remove(id, user);
    return { success: true, message: 'Fırsat başarıyla silindi', data: null };
  }

  @Post('opportunities/:id/notes')
  async addNote(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createOpportunityNoteSchema)) dto: CreateOpportunityNoteInput,
    @CurrentUser() user: { id: string; email: string; role?: string },
  ): Promise<ApiSuccessResponse<OpportunityNote>> {
    const data = await this.opportunityService.addNote(id, dto, user);
    return { success: true, message: 'Not eklendi', data };
  }

  @Get('opportunities/:id/notes')
  async getNotes(
    @Param('id') id: string,
  ): Promise<ApiSuccessResponse<OpportunityNote[]>> {
    const data = await this.opportunityService.getNotes(id);
    return { success: true, message: 'Notlar getirildi', data };
  }

  @Patch('opportunities/:oppId/notes/:noteId')
  async updateNote(
    @Param('oppId') oppId: string,
    @Param('noteId') noteId: string,
    @Body(new ZodValidationPipe(updateOpportunityNoteSchema)) dto: UpdateOpportunityNoteInput,
    @CurrentUser() user: { id: string; email: string; role?: string },
  ): Promise<ApiSuccessResponse<OpportunityNote>> {
    const data = await this.opportunityService.updateNote(oppId, noteId, dto, user);
    return { success: true, message: 'Not güncellendi', data };
  }

  @Delete('opportunities/:oppId/notes/:noteId')
  @HttpCode(HttpStatus.OK)
  async deleteNote(
    @Param('oppId') oppId: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: { id: string; email: string; role?: string },
  ): Promise<ApiSuccessResponse<null>> {
    await this.opportunityService.deleteNote(oppId, noteId, user);
    return { success: true, message: 'Not silindi', data: null };
  }
}
