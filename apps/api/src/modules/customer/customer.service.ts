import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Customer, CreateCustomerDto, UpdateCustomerDto, ConversionRate } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(fairId: string, dto: CreateCustomerDto): Promise<Customer> {
    await this.ensureFairExists(fairId);

    const customer = await this.prisma.customer.create({
      data: { ...dto, fairId },
    });

    this.logger.log(`Customer created: ${customer.company} - ${customer.name}`);
    return this.toCustomerResponse(customer);
  }

  async findByFair(
    fairId: string,
    search?: string,
    conversionRate?: ConversionRate
  ): Promise<Customer[]> {
    await this.ensureFairExists(fairId);

    const where: Record<string, unknown> = { fairId };

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (conversionRate) {
      where['conversionRate'] = conversionRate;
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => this.toCustomerResponse(c));
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this.ensureExists(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Customer updated: ${customer.company} - ${customer.name}`);
    return this.toCustomerResponse(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı');
    }

    await this.prisma.customer.delete({ where: { id } });
    this.logger.log(`Customer deleted: ${customer.company} - ${customer.name}`);
  }

  private async ensureFairExists(fairId: string): Promise<void> {
    const fair = await this.prisma.fair.findUnique({ where: { id: fairId } });
    if (!fair) {
      throw new NotFoundException('Fuar bulunamadı');
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı');
    }
  }

  private toCustomerResponse(customer: {
    id: string;
    company: string;
    name: string;
    phone: string | null;
    email: string | null;
    budgetRaw: string | null;
    budgetCurrency: string | null;
    conversionRate: string | null;
    products: string[];
    cardImage: string | null;
    fairId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return {
      id: customer.id,
      company: customer.company,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      budgetRaw: customer.budgetRaw,
      budgetCurrency: customer.budgetCurrency as Customer['budgetCurrency'],
      conversionRate: customer.conversionRate as Customer['conversionRate'],
      products: customer.products,
      cardImage: customer.cardImage,
      fairId: customer.fairId,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
