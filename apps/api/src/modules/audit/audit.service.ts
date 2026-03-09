import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

export type EntityType = 'fair' | 'customer' | 'user' | 'product' | 'setting';
export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLogPayload {
  userId?: string;
  userEmail?: string;
  entityType: EntityType;
  entityId?: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
}

export interface AuditLogFilters {
  from?: string; // ISO date
  to?: string;
  userId?: string;
  entityType?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: AuditLogFilters = {}): Promise<
    Array<{
      id: string;
      userId: string | null;
      userEmail: string | null;
      entityType: string;
      entityId: string | null;
      action: string;
      before: unknown;
      after: unknown;
      createdAt: string;
    }>
  > {
    const where: {
      createdAt?: { gte?: Date; lte?: Date };
      userId?: string;
      entityType?: string;
    } = {};
    if (filters.from) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.to) };
    }
    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;

    const list = await this.prisma.auditLog.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return list.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      before: r.before as unknown,
      after: r.after as unknown,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async log(payload: AuditLogPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: payload.userId ?? null,
          userEmail: payload.userEmail ?? null,
          entityType: payload.entityType,
          entityId: payload.entityId ?? null,
          action: payload.action,
          before: payload.before != null ? (payload.before as object) : undefined,
          after: payload.after != null ? (payload.after as object) : undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit log failed: ${err}`);
      // Do not throw - audit must not break main flow
    }
  }
}
