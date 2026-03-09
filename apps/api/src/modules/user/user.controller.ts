import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiSuccessResponse, User, updateUserSchema, UpdateUserDto } from '@crm/shared';
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
  async findAll(): Promise<ApiSuccessResponse<User[]>> {
    const data = await this.userService.findAll();
    return {
      success: true,
      message: 'Kullanıcılar başarıyla getirildi',
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
