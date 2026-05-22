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
  CustomerContact,
  createCustomerContactSchema,
  updateCustomerContactSchema,
  CreateCustomerContactDto,
  UpdateCustomerContactDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CustomerContactService } from './customer-contact.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CustomerContactController {
  constructor(private readonly customerContactService: CustomerContactService) {}

  @Get('customers/:customerId/contacts')
  async listByCustomer(
    @Param('customerId') customerId: string,
  ): Promise<ApiSuccessResponse<CustomerContact[]>> {
    const data = await this.customerContactService.listByCustomer(customerId);
    return { success: true, message: 'Temsilciler başarıyla getirildi', data };
  }

  @Post('customers/:customerId/contacts')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('customerId') customerId: string,
    @Query('force') force: string,
    @Body(new ZodValidationPipe(createCustomerContactSchema)) dto: CreateCustomerContactDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<CustomerContact>> {
    const data = await this.customerContactService.create(
      customerId,
      dto,
      { force: force === 'true' },
      user,
    );
    return { success: true, message: 'Temsilci başarıyla oluşturuldu', data };
  }

  @Patch('customer-contacts/:id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerContactSchema)) dto: UpdateCustomerContactDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<CustomerContact>> {
    const data = await this.customerContactService.update(id, dto, user);
    return { success: true, message: 'Temsilci başarıyla güncellendi', data };
  }

  @Delete('customer-contacts/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<ApiSuccessResponse<null>> {
    await this.customerContactService.remove(id, user);
    return { success: true, message: 'Temsilci başarıyla silindi', data: null };
  }
}
