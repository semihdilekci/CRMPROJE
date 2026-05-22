import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  Customer,
  CustomerWithContacts,
  CustomerContact,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateCustomerWithContactDto,
  type CustomerListItem,
  type CustomerListSortBy,
  type CustomerProfileResponse,
} from '@crm/shared';
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
    const customer = await this.prisma.customer.create({
      data: { company: dto.company, address: dto.address ?? null },
    });
    const result = this.toCustomerResponse(customer);

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'customer',
      entityId: customer.id,
      action: 'create',
      after: result,
    });

    this.logger.log(`Customer created: ${customer.company}`);
    return result;
  }

  async createWithContact(
    dto: CreateCustomerWithContactDto,
    auditUser?: AuditUser,
  ): Promise<CustomerWithContacts> {
    const customer = await this.prisma.customer.create({
      data: {
        company: dto.company,
        address: dto.address ?? null,
        ...(dto.contact
          ? { contacts: { create: [{ name: dto.contact.name, phone: dto.contact.phone ?? null, email: dto.contact.email ?? null, cardImage: dto.contact.cardImage ?? null }] } }
          : {}),
      },
      include: { contacts: true },
    });

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'customer',
      entityId: customer.id,
      action: 'create',
      after: { company: customer.company, contactCount: customer.contacts.length },
    });

    this.logger.log(`Customer with contact created: ${customer.company}`);
    return this.toCustomerWithContactsResponse(customer);
  }

  async findAll(search?: string, sortBy: CustomerListSortBy = 'lastContact'): Promise<CustomerListItem[]> {
    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { company: { contains: search, mode: 'insensitive' } },
        { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } },
        { contacts: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        contacts: { orderBy: { updatedAt: 'desc' } },
        opportunities: {
          select: {
            id: true,
            currentStage: true,
            budgetRaw: true,
            createdAt: true,
            stageLogs: {
              select: { createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const mapped = customers.map((customer) => {
      const opportunities = customer.opportunities ?? [];
      const wonCount = opportunities.filter((opp) => opp.currentStage === 'satisa_donustu').length;
      const activeCount = opportunities.filter(
        (opp) => opp.currentStage !== 'satisa_donustu' && opp.currentStage !== 'olumsuz',
      ).length;
      const opportunityCount = opportunities.length;

      let firstContact: Date | null = null;
      let lastContact: Date | null = null;
      let totalBudget = 0;

      for (const opportunity of opportunities) {
        const contactDate = opportunity.stageLogs[0]?.createdAt ?? opportunity.createdAt;
        if (!firstContact || contactDate < firstContact) firstContact = contactDate;
        if (!lastContact || contactDate > lastContact) lastContact = contactDate;

        if (opportunity.budgetRaw) {
          const parsedBudget = Number(opportunity.budgetRaw);
          if (!Number.isNaN(parsedBudget)) totalBudget += parsedBudget;
        }
      }

      const primaryContact = customer.contacts[0] ?? null;

      return {
        id: customer.id,
        company: customer.company,
        address: customer.address,
        contactCount: customer.contacts.length,
        primaryContact: primaryContact ? this.toContactResponse(primaryContact) : null,
        opportunityCount,
        wonCount,
        activeCount,
        firstContact: firstContact ? firstContact.toISOString() : null,
        lastContact: lastContact ? lastContact.toISOString() : null,
        totalBudgetRaw: totalBudget > 0 ? String(Math.round(totalBudget)) : null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      } satisfies CustomerListItem;
    });

    if (sortBy === 'company') {
      return mapped.sort((a, b) => a.company.localeCompare(b.company, 'tr'));
    }
    if (sortBy === 'opportunityCount') {
      return mapped.sort((a, b) => b.opportunityCount - a.opportunityCount);
    }
    return mapped.sort((a, b) => {
      if (!a.lastContact && !b.lastContact) return 0;
      if (!a.lastContact) return 1;
      if (!b.lastContact) return -1;
      return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
    });
  }

  async findById(id: string): Promise<CustomerWithContacts> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { contacts: { orderBy: { updatedAt: 'desc' } } },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');
    return this.toCustomerWithContactsResponse(customer);
  }

  async findProfileById(id: string): Promise<CustomerProfileResponse> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { updatedAt: 'desc' } },
        opportunities: {
          include: {
            contact: true,
            fair: {
              select: { id: true, name: true, startDate: true, endDate: true },
            },
            opportunityProducts: {
              include: {
                product: { select: { name: true } },
              },
            },
            stageLogs: {
              select: { stage: true, createdAt: true },
              orderBy: { createdAt: 'asc' },
            },
            opportunityNotes: {
              include: { createdBy: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    const opportunities = customer.opportunities;
    const wonOpportunities = opportunities.filter((item) => item.currentStage === 'satisa_donustu').length;
    const lostOpportunities = opportunities.filter((item) => item.currentStage === 'olumsuz').length;
    const activeOpportunities = opportunities.length - wonOpportunities - lostOpportunities;
    const totalOpportunities = opportunities.length;
    const conversionRate =
      totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;

    let firstContact: Date | null = null;
    let lastContact: Date | null = null;
    let totalBudget = 0;
    const budgetCurrencies = new Set<string>();

    for (const opportunity of opportunities) {
      const firstStageDate = opportunity.stageLogs[0]?.createdAt ?? opportunity.createdAt;
      const lastStageDate =
        opportunity.stageLogs[opportunity.stageLogs.length - 1]?.createdAt ?? opportunity.createdAt;
      if (!firstContact || firstStageDate < firstContact) firstContact = firstStageDate;
      if (!lastContact || lastStageDate > lastContact) lastContact = lastStageDate;

      if (opportunity.budgetRaw) {
        const parsedBudget = Number(opportunity.budgetRaw);
        if (!Number.isNaN(parsedBudget)) {
          totalBudget += parsedBudget;
          if (opportunity.budgetCurrency) budgetCurrencies.add(opportunity.budgetCurrency);
        }
      }
    }

    const timeline = opportunities
      .map((opportunity) => ({
        id: opportunity.id,
        fairId: opportunity.fair.id,
        fairName: opportunity.fair.name,
        fairStartDate: opportunity.fair.startDate.toISOString(),
        fairEndDate: opportunity.fair.endDate.toISOString(),
        currentStage: opportunity.currentStage,
        lossReason: opportunity.lossReason,
        budgetRaw: opportunity.budgetRaw,
        budgetCurrency: opportunity.budgetCurrency as 'USD' | 'EUR' | 'TRY' | 'GBP' | null,
        contact: opportunity.contact ? this.toContactResponse(opportunity.contact) : null,
        opportunityProducts: opportunity.opportunityProducts.map((item) => ({
          product: { name: item.product.name },
          quantity: item.quantity,
          unit: item.unit,
        })),
        stageLogs: opportunity.stageLogs.map((item) => ({
          stage: item.stage,
          createdAt: item.createdAt.toISOString(),
        })),
        notes: opportunity.opportunityNotes.map((note) => ({
          id: note.id,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
        })),
        createdAt: opportunity.createdAt.toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.fairStartDate).getTime() - new Date(a.fairStartDate).getTime(),
      );

    const pendingOpportunities = opportunities
      .filter(
        (opportunity) =>
          opportunity.currentStage !== 'satisa_donustu' && opportunity.currentStage !== 'olumsuz',
      )
      .map((opportunity) => {
        const lastStageDate =
          opportunity.stageLogs[opportunity.stageLogs.length - 1]?.createdAt ?? opportunity.createdAt;
        const dayMs = 1000 * 60 * 60 * 24;
        const daysSinceLastStageChange = Math.max(
          0,
          Math.floor((Date.now() - lastStageDate.getTime()) / dayMs),
        );
        return {
          id: opportunity.id,
          fairId: opportunity.fair.id,
          fairName: opportunity.fair.name,
          currentStage: opportunity.currentStage,
          budgetRaw: opportunity.budgetRaw,
          budgetCurrency: opportunity.budgetCurrency as 'USD' | 'EUR' | 'TRY' | 'GBP' | null,
          daysSinceLastStageChange,
        };
      });

    const allNotes = opportunities
      .flatMap((opportunity) =>
        opportunity.opportunityNotes.map((note) => ({
          id: note.id,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          createdBy: {
            id: note.createdBy.id,
            name: note.createdBy.name,
          },
          opportunityId: opportunity.id,
          fairName: opportunity.fair.name,
        })),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      customer: {
        id: customer.id,
        company: customer.company,
        address: customer.address ?? null,
      },
      contacts: customer.contacts.map(this.toContactResponse),
      kpi: {
        totalOpportunities,
        wonOpportunities,
        lostOpportunities,
        activeOpportunities,
        conversionRate,
        totalBudgetRaw: totalBudget > 0 ? String(Math.round(totalBudget)) : null,
        totalBudgetCurrency:
          budgetCurrencies.size === 1
            ? (Array.from(budgetCurrencies)[0] as 'USD' | 'EUR' | 'TRY' | 'GBP')
            : null,
        firstContact: firstContact ? firstContact.toISOString() : null,
        lastContact: lastContact ? lastContact.toISOString() : null,
      },
      pendingOpportunities,
      opportunityTimeline: timeline,
      allNotes,
    };
  }

  async update(id: string, dto: UpdateCustomerDto, auditUser?: AuditUser): Promise<Customer> {
    const old = await this.prisma.customer.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Müşteri bulunamadı');

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
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

    this.logger.log(`Customer updated: ${customer.company}`);
    return result;
  }

  async remove(id: string, auditUser?: AuditUser): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'customer',
      entityId: id,
      action: 'delete',
      before: this.toCustomerResponse(customer),
    });

    await this.prisma.customer.delete({ where: { id } });
    this.logger.log(`Customer deleted: ${customer.company}`);
  }

  private toCustomerResponse(customer: {
    id: string;
    company: string;
    address: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return {
      id: customer.id,
      company: customer.company,
      address: customer.address ?? null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  private toCustomerWithContactsResponse(customer: {
    id: string;
    company: string;
    address: string | null;
    createdAt: Date;
    updatedAt: Date;
    contacts: Array<{
      id: string;
      customerId: string;
      name: string;
      phone: string | null;
      email: string | null;
      cardImage: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): CustomerWithContacts {
    return {
      ...this.toCustomerResponse(customer),
      contacts: customer.contacts.map(this.toContactResponse),
    };
  }

  private toContactResponse(contact: {
    id: string;
    customerId: string;
    name: string;
    phone: string | null;
    email: string | null;
    cardImage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerContact {
    return {
      id: contact.id,
      customerId: contact.customerId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      cardImage: contact.cardImage,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }
}
