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
  CustomerListItem,
  CustomerListSortBy,
  CustomerProfileResponse,
  createCustomerSchema,
  updateCustomerSchema,
  CreateCustomerDto,
  UpdateCustomerDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CustomerService } from './customer.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createCustomerSchema)) dto: CreateCustomerDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<Customer>> {
    const data = await this.customerService.create(dto, user);
    return { success: true, message: 'Müşteri başarıyla oluşturuldu', data };
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: CustomerListSortBy,
  ): Promise<ApiSuccessResponse<CustomerListItem[]>> {
    const data = await this.customerService.findAll(search, sortBy ?? 'lastContact');
    return { success: true, message: 'Müşteriler başarıyla getirildi', data };
  }

  @Get(':id/profile')
  async findProfileById(
    @Param('id') id: string,
  ): Promise<ApiSuccessResponse<CustomerProfileResponse>> {
    const data = await this.customerService.findProfileById(id);
    return { success: true, message: 'Müşteri profili başarıyla getirildi', data };
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
  ): Promise<ApiSuccessResponse<Customer>> {
    const data = await this.customerService.findById(id);
    return { success: true, message: 'Müşteri başarıyla getirildi', data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<Customer>> {
    const data = await this.customerService.update(id, dto, user);
    return { success: true, message: 'Müşteri başarıyla güncellendi', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<null>> {
    await this.customerService.remove(id, user);
    return { success: true, message: 'Müşteri başarıyla silindi', data: null };
  }
}
