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
  Customer,
  createCustomerSchema,
  updateCustomerSchema,
  CreateCustomerDto,
  UpdateCustomerDto,
  ConversionRate,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CustomerService } from './customer.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('fairs/:fairId/customers')
  async create(
    @Param('fairId') fairId: string,
    @Body(new ZodValidationPipe(createCustomerSchema)) dto: CreateCustomerDto,
    @CurrentUser() user: { id: string; email: string }
  ): Promise<ApiSuccessResponse<Customer>> {
    const data = await this.customerService.create(fairId, dto, user);
    return { success: true, message: 'Müşteri başarıyla eklendi', data };
  }

  @Get('fairs/:fairId/customers')
  async findByFair(
    @Param('fairId') fairId: string,
    @Query('search') search?: string,
    @Query('conversionRate') conversionRate?: ConversionRate
  ): Promise<ApiSuccessResponse<Customer[]>> {
    const data = await this.customerService.findByFair(fairId, search, conversionRate);
    return { success: true, message: 'Müşteriler başarıyla getirildi', data };
  }

  @Patch('customers/:id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
    @CurrentUser() user: { id: string; email: string }
  ): Promise<ApiSuccessResponse<Customer>> {
    const data = await this.customerService.update(id, dto, user);
    return { success: true, message: 'Müşteri başarıyla güncellendi', data };
  }

  @Delete('customers/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string }
  ): Promise<ApiSuccessResponse<null>> {
    await this.customerService.remove(id, user);
    return { success: true, message: 'Müşteri başarıyla silindi', data: null };
  }
}
