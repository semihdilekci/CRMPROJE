import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Fair, FairWithCustomers, CreateFairDto, UpdateFairDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';

export interface AuditUser {
  id: string;
  email: string;
}

@Injectable()
export class FairService {
  private readonly logger = new Logger(FairService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async create(dto: CreateFairDto, createdById: string, auditUser?: AuditUser): Promise<Fair> {
    const fair = await this.prisma.fair.create({
      data: {
        name: dto.name,
        address: dto.address,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdById,
      },
    });
    const result = this.toFairResponse(fair);
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'fair',
      entityId: fair.id,
      action: 'create',
      after: result,
    });
    this.logger.log(`Fair created: ${fair.name}`);
    return result;
  }

  async findAll(): Promise<(Fair & { _count: { customers: number } })[]> {
    const fairs = await this.prisma.fair.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { customers: true } } },
    });

    return fairs.map((f) => ({
      ...this.toFairResponse(f),
      _count: f._count,
    }));
  }

  async findById(id: string): Promise<FairWithCustomers> {
    const fair = await this.prisma.fair.findUnique({
      where: { id },
      include: {
        customers: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!fair) {
      throw new NotFoundException('Fuar bulunamadı');
    }

    return {
      ...this.toFairResponse(fair),
      customers: fair.customers.map((c) => ({
        id: c.id,
        company: c.company,
        name: c.name,
        phone: c.phone,
        email: c.email,
        budgetRaw: c.budgetRaw,
        budgetCurrency: c.budgetCurrency as any,
        conversionRate: c.conversionRate as any,
        products: c.products,
        cardImage: c.cardImage,
        fairId: c.fairId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  async update(
    id: string,
    dto: UpdateFairDto,
    auditUser?: AuditUser
  ): Promise<Fair> {
    const old = await this.prisma.fair.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Fuar bulunamadı');

    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data['startDate'] = new Date(dto.startDate);
    if (dto.endDate) data['endDate'] = new Date(dto.endDate);

    const fair = await this.prisma.fair.update({
      where: { id },
      data,
    });
    const result = this.toFairResponse(fair);
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'fair',
      entityId: id,
      action: 'update',
      before: this.toFairResponse(old),
      after: result,
    });
    this.logger.log(`Fair updated: ${fair.name}`);
    return result;
  }

  async remove(id: string, auditUser?: AuditUser): Promise<void> {
    const old = await this.prisma.fair.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Fuar bulunamadı');
    await this.prisma.fair.delete({ where: { id } });
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'fair',
      entityId: id,
      action: 'delete',
      before: this.toFairResponse(old),
    });
    this.logger.log(`Fair deleted: ${id}`);
  }

  private toFairResponse(fair: {
    id: string;
    name: string;
    address: string;
    startDate: Date;
    endDate: Date;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): Fair {
    return {
      id: fair.id,
      name: fair.name,
      address: fair.address,
      startDate: fair.startDate.toISOString(),
      endDate: fair.endDate.toISOString(),
      createdById: fair.createdById,
      createdAt: fair.createdAt.toISOString(),
      updatedAt: fair.updatedAt.toISOString(),
    };
  }
}
