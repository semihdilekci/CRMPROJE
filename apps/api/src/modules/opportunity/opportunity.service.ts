import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  OpportunityWithDetails,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ConversionRate,
} from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';

export interface AuditUser {
  id: string;
  email: string;
}

@Injectable()
export class OpportunityService {
  private readonly logger = new Logger(OpportunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    fairId: string,
    dto: CreateOpportunityDto,
    auditUser?: AuditUser,
  ): Promise<OpportunityWithDetails> {
    await this.ensureFairExists(fairId);
    await this.ensureCustomerExists(dto.customerId);

    const opportunity = await this.prisma.opportunity.create({
      data: {
        fairId,
        customerId: dto.customerId,
        budgetRaw: dto.budgetRaw ?? null,
        budgetCurrency: dto.budgetCurrency ?? null,
        conversionRate: dto.conversionRate ?? null,
        products: dto.products ?? [],
        cardImage: dto.cardImage ?? null,
        opportunityProducts: dto.opportunityProducts
          ? {
              create: dto.opportunityProducts.map((item) => ({
                productId: item.productId,
                quantity: item.quantity ?? null,
                unit: item.unit ?? 'ton',
                note: item.note ?? null,
              })),
            }
          : undefined,
      },
      include: {
        customer: true,
        opportunityProducts: {
          include: { product: true },
        },
        stageLogs: {
          include: { changedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const result = this.toResponse(opportunity);

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'opportunity',
      entityId: opportunity.id,
      action: 'create',
      after: result,
    });

    this.logger.log(
      `Opportunity created for customer ${opportunity.customer.company} - ${opportunity.customer.name}`,
    );
    return result;
  }

  async findByFair(
    fairId: string,
    search?: string,
    conversionRate?: ConversionRate,
  ): Promise<OpportunityWithDetails[]> {
    await this.ensureFairExists(fairId);

    const where: Record<string, unknown> = { fairId };

    if (search) {
      where['customer'] = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (conversionRate) {
      where['conversionRate'] = conversionRate;
    }

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        customer: true,
        opportunityProducts: {
          include: { product: true },
        },
        stageLogs: {
          include: { changedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return opportunities.map((o) => this.toResponse(o));
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
    auditUser?: AuditUser,
  ): Promise<OpportunityWithDetails> {
    const old = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: true,
        opportunityProducts: {
          include: { product: true },
        },
        stageLogs: {
          include: { changedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!old) throw new NotFoundException('Fırsat bulunamadı');

    if (dto.customerId && dto.customerId !== old.customerId) {
      await this.ensureCustomerExists(dto.customerId);
    }

    const opportunity = await this.prisma.$transaction(async (tx) => {
      await tx.opportunity.update({
        where: { id },
        data: {
          ...(dto.customerId !== undefined && { customerId: dto.customerId }),
          ...(dto.budgetRaw !== undefined && { budgetRaw: dto.budgetRaw }),
          ...(dto.budgetCurrency !== undefined && { budgetCurrency: dto.budgetCurrency }),
          ...(dto.conversionRate !== undefined && { conversionRate: dto.conversionRate }),
          ...(dto.products !== undefined && { products: dto.products }),
          ...(dto.cardImage !== undefined && { cardImage: dto.cardImage }),
        },
        include: {
          customer: true,
        },
      });

      if (dto.opportunityProducts) {
        await tx.opportunityProduct.deleteMany({
          where: { opportunityId: id },
        });

        if (dto.opportunityProducts.length > 0) {
          await tx.opportunityProduct.createMany({
            data: dto.opportunityProducts.map((item) => ({
              opportunityId: id,
              productId: item.productId,
              quantity: item.quantity ?? null,
              unit: item.unit ?? 'ton',
              note: item.note ?? null,
            })),
          });
        }
      }

      return tx.opportunity.findUniqueOrThrow({
        where: { id },
        include: {
          customer: true,
          opportunityProducts: {
            include: { product: true },
          },
          stageLogs: {
            include: { changedBy: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    const result = this.toResponse(opportunity);

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'opportunity',
      entityId: id,
      action: 'update',
      before: this.toResponse(old),
      after: result,
    });

    this.logger.log(
      `Opportunity updated for customer ${opportunity.customer.company} - ${opportunity.customer.name}`,
    );
    return result;
  }

  async remove(id: string, auditUser?: AuditUser): Promise<void> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: true,
        opportunityProducts: {
          include: { product: true },
        },
        stageLogs: {
          include: { changedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!opportunity) throw new NotFoundException('Fırsat bulunamadı');

    const before = this.toResponse(opportunity);
    await this.prisma.opportunity.delete({ where: { id } });

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'opportunity',
      entityId: id,
      action: 'delete',
      before,
    });

    this.logger.log(
      `Opportunity deleted for customer ${opportunity.customer.company} - ${opportunity.customer.name}`,
    );
  }

  private async ensureFairExists(fairId: string): Promise<void> {
    const fair = await this.prisma.fair.findUnique({ where: { id: fairId } });
    if (!fair) throw new NotFoundException('Fuar bulunamadı');
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
  }

  private toResponse(opportunity: {
    id: string;
    fairId: string;
    customerId: string;
    budgetRaw: string | null;
    budgetCurrency: string | null;
    conversionRate: string | null;
    products: string[];
    cardImage: string | null;
    currentStage: string;
    lossReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer: {
      id: string;
      company: string;
      name: string;
      phone: string | null;
      email: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    opportunityProducts: Array<{
      id: string;
      quantity: number | null;
      unit: string;
      note: string | null;
      createdAt: Date;
      updatedAt: Date;
      product: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
    stageLogs?: Array<{
      id: string;
      stage: string;
      note: string | null;
      lossReason: string | null;
      createdAt: Date;
      changedBy: { id: string; name: string; email: string };
    }>;
  }): OpportunityWithDetails {
    return {
      id: opportunity.id,
      fairId: opportunity.fairId,
      customerId: opportunity.customerId,
      budgetRaw: opportunity.budgetRaw,
      budgetCurrency: opportunity.budgetCurrency as OpportunityWithDetails['budgetCurrency'],
      conversionRate: opportunity.conversionRate as OpportunityWithDetails['conversionRate'],
      products: opportunity.products,
      cardImage: opportunity.cardImage,
      currentStage: opportunity.currentStage,
      lossReason: opportunity.lossReason,
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
      customer: {
        id: opportunity.customer.id,
        company: opportunity.customer.company,
        name: opportunity.customer.name,
        phone: opportunity.customer.phone,
        email: opportunity.customer.email,
        createdAt: opportunity.customer.createdAt.toISOString(),
        updatedAt: opportunity.customer.updatedAt.toISOString(),
      },
      opportunityProducts: (opportunity.opportunityProducts ?? []).map((item) => ({
        id: item.id,
        opportunityId: opportunity.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      stageLogs: (opportunity.stageLogs ?? []).map((log) => ({
        id: log.id,
        opportunityId: opportunity.id,
        stage: log.stage,
        note: log.note,
        lossReason: log.lossReason,
        createdAt: log.createdAt.toISOString(),
        changedBy: {
          id: log.changedBy.id,
          name: log.changedBy.name,
          email: log.changedBy.email,
        },
      })),
    };
  }
}
