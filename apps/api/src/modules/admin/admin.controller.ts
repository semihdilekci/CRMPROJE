import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  @Get()
  check(): { ok: boolean } {
    return { ok: true };
  }
}
