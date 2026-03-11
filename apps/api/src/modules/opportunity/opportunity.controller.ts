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
} from '@nestjs/common';
import {
  ApiSuccessResponse,
  OpportunityWithDetails,
  createOpportunitySchema,
  updateOpportunitySchema,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ConversionRate,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { OpportunityService } from './opportunity.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

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
  ): Promise<ApiSuccessResponse<OpportunityWithDetails[]>> {
    const data = await this.opportunityService.findByFair(fairId, search, conversionRate);
    return { success: true, message: 'Fırsatlar başarıyla getirildi', data };
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

  @Delete('opportunities/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<null>> {
    await this.opportunityService.remove(id, user);
    return { success: true, message: 'Fırsat başarıyla silindi', data: null };
  }
}
