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
  TeamWithUserCount,
  createTeamSchema,
  updateTeamSchema,
  CreateTeamDto,
  UpdateTeamDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { TeamService } from './team.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  async findAll(
    @Query('search') searchParam?: string | string[],
    @Query('active') activeParam?: string | string[]
  ): Promise<ApiSuccessResponse<TeamWithUserCount[]>> {
    const searchStr =
      searchParam == null
        ? ''
        : typeof searchParam === 'string'
          ? searchParam.trim()
          : Array.isArray(searchParam) && searchParam[0] != null
            ? String(searchParam[0]).trim()
            : '';
    const activeStr =
      activeParam == null
        ? ''
        : typeof activeParam === 'string'
          ? activeParam.trim()
          : Array.isArray(activeParam) && activeParam[0] != null
            ? String(activeParam[0]).trim()
            : '';

    const data = await this.teamService.findAll({
      search: searchStr.length > 0 ? searchStr : undefined,
      active: activeStr === 'true' ? true : activeStr === 'false' ? false : undefined,
    });
    return { success: true, message: 'Ekipler başarıyla getirildi', data };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiSuccessResponse<TeamWithUserCount>> {
    const data = await this.teamService.findById(id);
    return { success: true, message: 'Ekip başarıyla getirildi', data };
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createTeamSchema)) dto: CreateTeamDto
  ): Promise<ApiSuccessResponse<TeamWithUserCount>> {
    const data = await this.teamService.create(dto);
    return { success: true, message: 'Ekip başarıyla oluşturuldu', data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTeamSchema)) dto: UpdateTeamDto
  ): Promise<ApiSuccessResponse<TeamWithUserCount>> {
    const data = await this.teamService.update(id, dto);
    return { success: true, message: 'Ekip başarıyla güncellendi', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ApiSuccessResponse<null>> {
    await this.teamService.remove(id);
    return { success: true, message: 'Ekip başarıyla silindi', data: null };
  }
}
