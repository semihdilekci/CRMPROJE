import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Fair, FairWithCustomers, CreateFairDto, UpdateFairDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class FairService {
  private readonly logger = new Logger(FairService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFairDto, createdById: string): Promise<Fair> {
    const fair = await this.prisma.fair.create({
      data: {
        name: dto.name,
        address: dto.address,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdById,
      },
    });

    this.logger.log(`Fair created: ${fair.name}`);
    return this.toFairResponse(fair);
  }

  async findAll(): Promise<Fair[]> {
    const fairs = await this.prisma.fair.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { customers: true } } },
    });

    return fairs.map((f) => this.toFairResponse(f));
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

  async update(id: string, dto: UpdateFairDto): Promise<Fair> {
    await this.ensureExists(id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data['startDate'] = new Date(dto.startDate);
    if (dto.endDate) data['endDate'] = new Date(dto.endDate);

    const fair = await this.prisma.fair.update({
      where: { id },
      data,
    });

    this.logger.log(`Fair updated: ${fair.name}`);
    return this.toFairResponse(fair);
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.fair.delete({ where: { id } });
    this.logger.log(`Fair deleted: ${id}`);
  }

  private async ensureExists(id: string): Promise<void> {
    const fair = await this.prisma.fair.findUnique({ where: { id } });
    if (!fair) {
      throw new NotFoundException('Fuar bulunamadı');
    }
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
