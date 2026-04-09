import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  Fair,
  FairWithOpportunities,
  FairMetrics,
  CreateFairDto,
  UpdateFairDto,
  Currency,
  ConversionRate,
  parseBudgetToNumber,
} from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import { SettingsService } from '@modules/settings/settings.service';
import { budgetToTRY } from '@modules/report/report.helpers';

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
    private readonly settingsService: SettingsService,
  ) {}

  async create(dto: CreateFairDto, createdById: string, auditUser?: AuditUser): Promise<Fair> {
    const fair = await this.prisma.fair.create({
      data: {
        name: dto.name,
        address: dto.address,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdById,
        targetBudget: dto.targetBudget ?? null,
        targetTonnage: dto.targetTonnage ?? null,
        targetLeadCount: dto.targetLeadCount ?? null,
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
          include: {
            customer: true,
            opportunityProducts: { include: { product: true } },
            stageLogs: {
              include: { changedBy: { select: { id: true, name: true, email: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
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
        budgetCurrency: o.budgetCurrency as Currency,
        conversionRate: o.conversionRate as ConversionRate,
        products: o.products,
        currentStage: o.currentStage,
        lossReason: o.lossReason,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        customer: {
          id: o.customer.id,
          company: o.customer.company,
          name: o.customer.name,
          address: o.customer.address ?? null,
          phone: o.customer.phone,
          email: o.customer.email,
          cardImage: o.customer.cardImage ?? null,
          createdAt: o.customer.createdAt.toISOString(),
          updatedAt: o.customer.updatedAt.toISOString(),
        },
        opportunityProducts: o.opportunityProducts.map((op) => ({
          id: op.id,
          opportunityId: o.id,
          productId: op.productId,
          productName: op.product.name,
          quantity: op.quantity,
          unit: op.unit,
          note: op.note,
          createdAt: op.createdAt.toISOString(),
          updatedAt: op.updatedAt.toISOString(),
        })),
        stageLogs: (o.stageLogs ?? []).map((log) => ({
          id: log.id,
          opportunityId: o.id,
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
      })),
    };
  }

  async update(id: string, dto: UpdateFairDto, auditUser?: AuditUser): Promise<Fair> {
    const old = await this.prisma.fair.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Fuar bulunamadı');

    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data['startDate'] = new Date(dto.startDate);
    if (dto.endDate) data['endDate'] = new Date(dto.endDate);
    if (dto.targetBudget !== undefined) data['targetBudget'] = dto.targetBudget;
    if (dto.targetTonnage !== undefined) data['targetTonnage'] = dto.targetTonnage;
    if (dto.targetLeadCount !== undefined) data['targetLeadCount'] = dto.targetLeadCount;

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

  async getMetrics(fairId: string): Promise<FairMetrics> {
    const fair = await this.prisma.fair.findUnique({
      where: { id: fairId },
      include: {
        opportunities: {
          include: { opportunityProducts: true },
        },
      },
    });

    if (!fair) {
      throw new NotFoundException('Fuar bulunamadı');
    }

    const rates = await this.settingsService.getExchangeRates();
    const opportunities = fair.opportunities;
    const totalOpportunities = opportunities.length;

    const wonOpportunities = opportunities.filter((o) => o.currentStage === 'satisa_donustu').length;
    const lostOpportunities = opportunities.filter((o) => o.currentStage === 'olumsuz').length;
    const openOpportunities = opportunities.filter(
      (o) => o.currentStage !== 'satisa_donustu' && o.currentStage !== 'olumsuz',
    ).length;
    const proposalSentCount = opportunities.filter((o) => o.currentStage === 'teklif').length;

    let totalTonnage = 0;
    let wonTonnage = 0;
    for (const opp of opportunities) {
      const oppTonnage =
        opp.opportunityProducts?.reduce((sum, op) => sum + (op.quantity ?? 0), 0) ?? 0;
      totalTonnage += oppTonnage;
      if (opp.currentStage === 'satisa_donustu') {
        wonTonnage += oppTonnage;
      }
    }

    let totalPipelineValue = 0;
    let wonPipelineValue = 0;
    for (const opp of opportunities) {
      const budgetTry = budgetToTRY(opp.budgetRaw, opp.budgetCurrency, rates);
      if (opp.currentStage !== 'satisa_donustu' && opp.currentStage !== 'olumsuz') {
        totalPipelineValue += budgetTry;
      }
      if (opp.currentStage === 'satisa_donustu') {
        wonPipelineValue += budgetTry;
      }
    }

    const conversionRate =
      totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 1000) / 10 : 0;

    const targetBudget = fair.targetBudget ? parseBudgetToNumber(fair.targetBudget) : null;
    const targetTonnage = fair.targetTonnage;
    const targetLeadCount = fair.targetLeadCount;

    const targetBudgetProgress =
      targetBudget != null && targetBudget > 0
        ? Math.round((wonPipelineValue / targetBudget) * 1000) / 10
        : null;
    const targetTonnageProgress =
      targetTonnage != null && targetTonnage > 0
        ? Math.round((wonTonnage / targetTonnage) * 1000) / 10
        : null;
    const targetLeadCountProgress =
      targetLeadCount != null && targetLeadCount > 0
        ? Math.round((totalOpportunities / targetLeadCount) * 1000) / 10
        : null;

    return {
      totalOpportunities,
      wonOpportunities,
      lostOpportunities,
      openOpportunities,
      proposalSentCount,
      totalTonnage,
      wonTonnage,
      totalPipelineValue,
      wonPipelineValue,
      conversionRate,
      targetBudgetProgress,
      targetTonnageProgress,
      targetLeadCountProgress,
    };
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
    targetBudget?: string | null;
    targetTonnage?: number | null;
    targetLeadCount?: number | null;
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
      targetBudget: fair.targetBudget ?? null,
      targetTonnage: fair.targetTonnage ?? null,
      targetLeadCount: fair.targetLeadCount ?? null,
    };
  }
}
