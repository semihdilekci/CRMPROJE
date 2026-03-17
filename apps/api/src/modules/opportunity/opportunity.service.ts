import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  OpportunityWithDetails,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ConversionRate,
  getStageOrder,
  isTerminalStage,
  type StageTransitionInput,
  type UpdateStageLogInput,
  type OpportunityNote,
  type CreateOpportunityNoteInput,
  type UpdateOpportunityNoteInput,
} from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';

export interface AuditUser {
  id: string;
  email: string;
  role?: string;
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
    if (!auditUser) {
      throw new BadRequestException('Fırsat oluşturmak için giriş yapmanız gerekiyor');
    }

    const opportunity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          fairId,
          customerId: dto.customerId,
          budgetRaw: dto.budgetRaw ?? null,
          budgetCurrency: dto.budgetCurrency ?? null,
          conversionRate: dto.conversionRate ?? null,
          products: dto.products ?? [],
          currentStage: 'tanisma',
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
      });

      await tx.opportunityStageLog.create({
        data: {
          opportunityId: created.id,
          stage: 'tanisma',
          changedById: auditUser.id,
        },
      });

      return tx.opportunity.findUniqueOrThrow({
        where: { id: created.id },
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
    currentStage?: string,
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

    if (currentStage) {
      where['currentStage'] = currentStage;
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

  async transitionStage(
    id: string,
    dto: StageTransitionInput,
    auditUser?: AuditUser,
  ): Promise<OpportunityWithDetails> {
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

    const currentOrder = getStageOrder(opportunity.currentStage);
    const targetOrder = getStageOrder(dto.stage);
    const targetTerminal = isTerminalStage(dto.stage);

    if (isTerminalStage(opportunity.currentStage)) {
      throw new BadRequestException(
        'Terminal aşamadaki (Satışa Dönüştü / Olumsuz) fırsatta aşama değiştirilemez',
      );
    }

    const allowedForward = targetOrder > currentOrder;
    const allowedTerminal = targetTerminal;
    const isOlumsuz = dto.stage === 'olumsuz';
    if (!allowedForward && !allowedTerminal) {
      throw new BadRequestException(
        'Hedef aşama mevcut aşamadan ileri veya terminal (Satışa Dönüştü / Olumsuz) olmalıdır',
      );
    }
    if (isOlumsuz && (dto.lossReason == null || dto.lossReason === '')) {
      throw new BadRequestException('Olumsuz aşamada kayıp nedeni zorunludur');
    }

    if (!auditUser) {
      throw new BadRequestException('Aşama değişikliği için giriş yapmanız gerekiyor');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.opportunityStageLog.create({
        data: {
          opportunityId: id,
          stage: dto.stage,
          note: dto.note ?? null,
          lossReason: dto.lossReason ?? null,
          changedById: auditUser.id,
        },
      });

      const opp = await tx.opportunity.update({
        where: { id },
        data: {
          currentStage: dto.stage,
          ...(isOlumsuz && dto.lossReason != null && { lossReason: dto.lossReason }),
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
      return opp;
    });

    const result = this.toResponse(updated);
    await this.auditService.log({
      userId: auditUser.id,
      userEmail: auditUser.email,
      entityType: 'opportunity',
      entityId: id,
      action: 'update',
      after: result,
    });
    this.logger.log(
      `Opportunity ${id} stage transition to ${dto.stage} by ${auditUser.email}`,
    );
    return result;
  }

  async getStageHistory(opportunityId: string) {
    await this.ensureOpportunityExists(opportunityId);
    const logs = await this.prisma.opportunityStageLog.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'asc' },
      include: {
        changedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return logs.map((log) => ({
      id: log.id,
      opportunityId: log.opportunityId,
      stage: log.stage,
      note: log.note,
      lossReason: log.lossReason,
      createdAt: log.createdAt.toISOString(),
      changedBy: {
        id: log.changedBy.id,
        name: log.changedBy.name,
        email: log.changedBy.email,
      },
    }));
  }

  async getPipelineStats(fairId: string) {
    await this.ensureFairExists(fairId);

    const stages = await this.prisma.opportunity.groupBy({
      by: ['currentStage'],
      where: { fairId },
      _count: { id: true },
    });

    const byStage: Record<string, number> = {};
    let openTotal = 0;
    let wonCount = 0;
    let lostCount = 0;

    for (const row of stages) {
      byStage[row.currentStage] = row._count.id;
      if (row.currentStage === 'satisa_donustu') {
        wonCount += row._count.id;
      } else if (row.currentStage === 'olumsuz') {
        lostCount += row._count.id;
      } else {
        openTotal += row._count.id;
      }
    }

    return {
      byStage,
      openTotal,
      wonCount,
      lostCount,
    };
  }

  async updateStageLog(
    opportunityId: string,
    logId: string,
    dto: UpdateStageLogInput,
    auditUser?: AuditUser,
  ) {
    const log = await this.prisma.opportunityStageLog.findUnique({
      where: { id: logId },
      include: { opportunity: true },
    });

    if (!log || log.opportunityId !== opportunityId) {
      throw new NotFoundException('Aşama kaydı bulunamadı');
    }

    const before = {
      id: log.id,
      opportunityId: log.opportunityId,
      stage: log.stage,
      note: log.note,
      lossReason: log.lossReason,
      createdAt: log.createdAt,
    };

    const updated = await this.prisma.opportunityStageLog.update({
      where: { id: logId },
      data: {
        createdAt: dto.createdAt ? new Date(dto.createdAt) : log.createdAt,
        note: dto.note ?? null,
      },
    });

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'opportunity',
      entityId: opportunityId,
      action: 'update',
      before,
      after: {
        id: updated.id,
        opportunityId: updated.opportunityId,
        stage: updated.stage,
        note: updated.note,
        lossReason: updated.lossReason,
        createdAt: updated.createdAt,
      },
    });

    return this.getStageHistory(opportunityId);
  }

  async deleteLastStageLog(
    opportunityId: string,
    logId: string,
    auditUser?: AuditUser,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const logs = await tx.opportunityStageLog.findMany({
        where: { opportunityId },
        orderBy: { createdAt: 'asc' },
      });

      if (!logs.length) {
        throw new NotFoundException('Aşama kaydı bulunamadı');
      }

      const last = logs[logs.length - 1]!;
      if (last.id !== logId) {
        throw new BadRequestException('Sadece son aşama kaydı silinebilir');
      }

      const previous = logs.length > 1 ? logs[logs.length - 2] : null;
      const newStage = previous ? previous.stage : 'tanisma';
      const newLossReason =
        previous && previous.stage === 'olumsuz' ? previous.lossReason : null;

      await tx.opportunityStageLog.delete({ where: { id: logId } });

      const updatedOpportunity = await tx.opportunity.update({
        where: { id: opportunityId },
        data: {
          currentStage: newStage,
          lossReason: newLossReason,
        },
      });

      return {
        newStage,
        newLossReason,
        opportunityId: updatedOpportunity.id,
      };
    });

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'opportunity',
      entityId: opportunityId,
      action: 'update',
      after: {
        currentStage: result.newStage,
        lossReason: result.newLossReason,
      },
    });

    return this.getStageHistory(opportunityId);
  }

  async addNote(
    opportunityId: string,
    dto: CreateOpportunityNoteInput,
    auditUser?: AuditUser,
  ): Promise<OpportunityNote> {
    await this.ensureOpportunityExists(opportunityId);
    if (!auditUser) {
      throw new BadRequestException('Not eklemek için giriş yapmanız gerekiyor');
    }

    const note = await this.prisma.opportunityNote.create({
      data: {
        opportunityId,
        content: dto.content.trim(),
        createdById: auditUser.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: note.id,
      opportunityId: note.opportunityId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      createdBy: note.createdBy,
    };
  }

  async getNotes(opportunityId: string): Promise<OpportunityNote[]> {
    await this.ensureOpportunityExists(opportunityId);
    const notes = await this.prisma.opportunityNote.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return notes.map((n) => ({
      id: n.id,
      opportunityId: n.opportunityId,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      createdBy: n.createdBy,
    }));
  }

  async updateNote(
    opportunityId: string,
    noteId: string,
    dto: UpdateOpportunityNoteInput,
    auditUser?: AuditUser,
  ): Promise<OpportunityNote> {
    const note = await this.prisma.opportunityNote.findUnique({
      where: { id: noteId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (!note || note.opportunityId !== opportunityId) {
      throw new NotFoundException('Not bulunamadı');
    }
    const isAdmin = auditUser?.role === 'admin';
    const isAuthor = note.createdById === auditUser?.id;
    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException('Bu notu düzenleme yetkiniz yok');
    }

    const updated = await this.prisma.opportunityNote.update({
      where: { id: noteId },
      data: { content: dto.content.trim() },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return {
      id: updated.id,
      opportunityId: updated.opportunityId,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      createdBy: updated.createdBy,
    };
  }

  async deleteNote(
    opportunityId: string,
    noteId: string,
    auditUser?: AuditUser,
  ): Promise<void> {
    const note = await this.prisma.opportunityNote.findUnique({
      where: { id: noteId },
    });
    if (!note || note.opportunityId !== opportunityId) {
      throw new NotFoundException('Not bulunamadı');
    }
    const isAdmin = auditUser?.role === 'admin';
    const isAuthor = note.createdById === auditUser?.id;
    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException('Bu notu silme yetkiniz yok');
    }
    await this.prisma.opportunityNote.delete({ where: { id: noteId } });
  }

  private async ensureFairExists(fairId: string): Promise<void> {
    const fair = await this.prisma.fair.findUnique({ where: { id: fairId } });
    if (!fair) throw new NotFoundException('Fuar bulunamadı');
  }

  private async ensureOpportunityExists(opportunityId: string): Promise<void> {
    const opp = await this.prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) throw new NotFoundException('Fırsat bulunamadı');
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
    currentStage: string;
    lossReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer: {
      id: string;
      company: string;
      name: string;
      address?: string | null;
      phone: string | null;
      email: string | null;
      cardImage?: string | null;
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
      currentStage: opportunity.currentStage,
      lossReason: opportunity.lossReason,
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
      customer: {
        id: opportunity.customer.id,
        company: opportunity.customer.company,
        name: opportunity.customer.name,
        address: opportunity.customer.address ?? null,
        phone: opportunity.customer.phone,
        email: opportunity.customer.email,
        cardImage: opportunity.customer.cardImage ?? null,
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
