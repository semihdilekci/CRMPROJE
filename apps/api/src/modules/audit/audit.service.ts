import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

export type EntityType = 'fair' | 'customer' | 'opportunity' | 'user' | 'product' | 'setting';
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
  page?: number;
  limit?: number;
}

export interface AuditLogListResult {
  data: Array<{
    id: string;
    userId: string | null;
    userEmail: string | null;
    entityType: string;
    entityId: string | null;
    action: string;
    before: unknown;
    after: unknown;
    createdAt: string;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: AuditLogFilters = {}): Promise<AuditLogListResult> {
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

    const page = Math.max(1, filters.page ?? 1);
    const rawLimit = filters.limit ?? 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.auditLog.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    const data = list.map((r) => ({
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

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
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
