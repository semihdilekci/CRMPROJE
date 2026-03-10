import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiSuccessResponse,
  Fair,
  FairWithOpportunities,
  createFairSchema,
  updateFairSchema,
  CreateFairDto,
  UpdateFairDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { FairService } from './fair.service';

@Controller('fairs')
@UseGuards(JwtAuthGuard)
export class FairController {
  constructor(private readonly fairService: FairService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createFairSchema)) dto: CreateFairDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<Fair>> {
    const data = await this.fairService.create(dto, user.id, user);
    return { success: true, message: 'Fuar başarıyla oluşturuldu', data };
  }

  @Get()
  async findAll(): Promise<ApiSuccessResponse<Fair[]>> {
    const data = await this.fairService.findAll();
    return { success: true, message: 'Fuarlar başarıyla getirildi', data };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiSuccessResponse<FairWithOpportunities>> {
    const data = await this.fairService.findById(id);
    return { success: true, message: 'Fuar detayı başarıyla getirildi', data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFairSchema)) dto: UpdateFairDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<Fair>> {
    const data = await this.fairService.update(id, dto, user);
    return { success: true, message: 'Fuar başarıyla güncellendi', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<null>> {
    await this.fairService.remove(id, user);
    return { success: true, message: 'Fuar başarıyla silindi', data: null };
  }
}
