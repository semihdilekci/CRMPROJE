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
  User,
  createUserSchema,
  updateUserSchema,
  CreateUserDto,
  UpdateUserDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string
  ): Promise<ApiSuccessResponse<User[]>> {
    const data = await this.userService.findAll({ search, role });
    return {
      success: true,
      message: 'Kullanıcılar başarıyla getirildi',
      data,
    };
  }

  @Post()
  @Roles('admin')
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto
  ): Promise<ApiSuccessResponse<User>> {
    const data = await this.userService.create(dto);
    return {
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiSuccessResponse<User>> {
    const data = await this.userService.findById(id);
    return {
      success: true,
      message: 'Kullanıcı başarıyla getirildi',
      data,
    };
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto
  ): Promise<ApiSuccessResponse<User>> {
    const data = await this.userService.update(id, dto);
    return {
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ApiSuccessResponse<null>> {
    await this.userService.remove(id);
    return {
      success: true,
      message: 'Kullanıcı başarıyla silindi',
      data: null,
    };
  }
}
