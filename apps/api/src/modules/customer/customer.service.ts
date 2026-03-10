import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';

export interface AuditUser {
  id: string;
  email: string;
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCustomerDto, auditUser?: AuditUser): Promise<Customer> {
    const customer = await this.prisma.customer.create({ data: dto });
    const result = this.toCustomerResponse(customer);

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'customer',
      entityId: customer.id,
      action: 'create',
      after: result,
    });

    this.logger.log(`Customer created: ${customer.company} - ${customer.name}`);
    return result;
  }

  async findAll(search?: string): Promise<Customer[]> {
    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => this.toCustomerResponse(c));
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return this.toCustomerResponse(customer);
  }

  async update(id: string, dto: UpdateCustomerDto, auditUser?: AuditUser): Promise<Customer> {
    const old = await this.prisma.customer.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Müşteri bulunamadı');

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });
    const result = this.toCustomerResponse(customer);

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'customer',
      entityId: id,
      action: 'update',
      before: this.toCustomerResponse(old),
      after: result,
    });

    this.logger.log(`Customer updated: ${customer.company} - ${customer.name}`);
    return result;
  }

  async remove(id: string, auditUser?: AuditUser): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    const before = this.toCustomerResponse(customer);
    await this.prisma.customer.delete({ where: { id } });

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'customer',
      entityId: id,
      action: 'delete',
      before,
    });

    this.logger.log(`Customer deleted: ${customer.company} - ${customer.name}`);
  }

  private toCustomerResponse(customer: {
    id: string;
    company: string;
    name: string;
    phone: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return {
      id: customer.id,
      company: customer.company,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
