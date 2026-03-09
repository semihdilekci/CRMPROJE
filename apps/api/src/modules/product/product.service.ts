import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Product, CreateProductDto, UpdateProductDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';

export interface AuditUser {
  id: string;
  email: string;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async findAll(search?: string): Promise<Product[]> {
    const where = search?.trim()
      ? { name: { contains: search.trim(), mode: 'insensitive' as const } }
      : undefined;
    const list = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return list.map((p) => this.toResponse(p));
  }

  async findById(id: string): Promise<Product> {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Ürün bulunamadı');
    return this.toResponse(p);
  }

  async countCustomersByProductName(productName: string): Promise<number> {
    return this.prisma.customer.count({
      where: { products: { has: productName } },
    });
  }

  async create(dto: CreateProductDto, auditUser?: AuditUser): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existing) throw new ConflictException('Bu isimde bir ürün zaten var');
    const p = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });
    const result = this.toResponse(p);
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'product',
      entityId: p.id,
      action: 'create',
      after: result,
    });
    this.logger.log(`Product created: ${p.name}`);
    return result;
  }

  async update(id: string, dto: UpdateProductDto, auditUser?: AuditUser): Promise<Product> {
    const old = await this.prisma.product.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Ürün bulunamadı');
    if (dto.name !== undefined) {
      const existing = await this.prisma.product.findFirst({
        where: { name: dto.name.trim(), id: { not: id } },
      });
      if (existing) throw new ConflictException('Bu isimde başka bir ürün zaten var');
    }
    const p = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      },
    });
    const result = this.toResponse(p);
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'product',
      entityId: id,
      action: 'update',
      before: this.toResponse(old),
      after: result,
    });
    this.logger.log(`Product updated: ${p.name}`);
    return result;
  }

  async remove(id: string, auditUser?: AuditUser): Promise<void> {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Ürün bulunamadı');
    const before = this.toResponse(p);
    await this.prisma.product.delete({ where: { id } });
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'product',
      entityId: id,
      action: 'delete',
      before,
    });
    this.logger.log(`Product deleted: ${p.name}`);
  }

  private toResponse(p: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
