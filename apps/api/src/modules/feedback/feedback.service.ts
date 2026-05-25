import { Injectable } from '@nestjs/common';
import type { CreateFeedbackDto, Feedback, FeedbackListQueryDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';

export interface FeedbackListResult {
  data: Feedback[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedbackDto): Promise<Feedback> {
    const row = await this.prisma.feedback.create({
      data: {
        userId,
        category: dto.category,
        message: dto.message,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return this.toFeedback(row);
  }

  async findAll(query: FeedbackListQueryDto = {}): Promise<FeedbackListResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = query.category ? { category: query.category } : undefined;

    const [rows, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toFeedback(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private toFeedback(row: {
    id: string;
    userId: string;
    category: string;
    message: string;
    createdAt: Date;
    user: { id: string; name: string; email: string };
  }): Feedback {
    return {
      id: row.id,
      userId: row.userId,
      userName: row.user.name,
      userEmail: row.user.email,
      category: row.category as Feedback['category'],
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
