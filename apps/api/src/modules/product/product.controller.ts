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
  Product,
  createProductSchema,
  updateProductSchema,
  CreateProductDto,
  UpdateProductDto,
} from '@crm/shared';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ProductService } from './product.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query('search') search?: string): Promise<ApiSuccessResponse<Product[]>> {
    const searchStr = typeof search === 'string' ? search.trim() : '';
    const data = await this.productService.findAll(searchStr.length > 0 ? searchStr : undefined);
    return {
      success: true,
      message: 'Ürünler başarıyla getirildi',
      data,
    };
  }

  @Get(':id/customer-count')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getCustomerCount(@Param('id') id: string): Promise<ApiSuccessResponse<{ count: number }>> {
    const product = await this.productService.findById(id);
    const count = await this.productService.countCustomersByProductName(product.name);
    return {
      success: true,
      message: 'Müşteri sayısı getirildi',
      data: { count },
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiSuccessResponse<Product>> {
    const data = await this.productService.findById(id);
    return {
      success: true,
      message: 'Ürün başarıyla getirildi',
      data,
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto
  ): Promise<ApiSuccessResponse<Product>> {
    const data = await this.productService.create(dto);
    return {
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto
  ): Promise<ApiSuccessResponse<Product>> {
    const data = await this.productService.update(id, dto);
    return {
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ApiSuccessResponse<null>> {
    await this.productService.remove(id);
    return {
      success: true,
      message: 'Ürün başarıyla silindi',
      data: null,
    };
  }
}
