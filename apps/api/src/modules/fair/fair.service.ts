import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Fair, FairWithOpportunities, CreateFairDto, UpdateFairDto } from '@crm/shared';
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
    private readonly auditService: AuditService,
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

  async findAll(): Promise<(Fair & { _count: { opportunities: number } })[]> {
    const fairs = await this.prisma.fair.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { opportunities: true } } },
    });

    return fairs.map((f) => ({
      ...this.toFairResponse(f),
      _count: f._count,
    }));
  }

  async findById(id: string): Promise<FairWithOpportunities> {
    const fair = await this.prisma.fair.findUnique({
      where: { id },
      include: {
        opportunities: {
          include: { customer: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!fair) {
      throw new NotFoundException('Fuar bulunamadı');
    }

    return {
      ...this.toFairResponse(fair),
      opportunities: fair.opportunities.map((o) => ({
        id: o.id,
        fairId: o.fairId,
        customerId: o.customerId,
        budgetRaw: o.budgetRaw,
        budgetCurrency: o.budgetCurrency as any,
        conversionRate: o.conversionRate as any,
        products: o.products,
        cardImage: o.cardImage,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        customer: {
          id: o.customer.id,
          company: o.customer.company,
          name: o.customer.name,
          phone: o.customer.phone,
          email: o.customer.email,
          createdAt: o.customer.createdAt.toISOString(),
          updatedAt: o.customer.updatedAt.toISOString(),
        },
      })),
    };
  }

  async update(id: string, dto: UpdateFairDto, auditUser?: AuditUser): Promise<Fair> {
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
