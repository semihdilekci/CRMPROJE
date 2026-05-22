import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  CustomerContact,
  CreateCustomerContactDto,
  UpdateCustomerContactDto,
} from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';

@Injectable()
export class CustomerContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listByCustomer(customerId: string): Promise<CustomerContact[]> {
    await this.ensureCustomerExists(customerId);
    const contacts = await this.prisma.customerContact.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
    });
    return contacts.map(this.toResponse);
  }

  async create(
    customerId: string,
    dto: CreateCustomerContactDto,
    options: { force?: boolean },
    auditUser: { id: string; email: string },
  ): Promise<CustomerContact> {
    await this.ensureCustomerExists(customerId);

    if (!options.force) {
      const duplicateResult = await this.findDuplicate(customerId, dto);
      if (duplicateResult) {
        const { contact: duplicate, matchedBy } = duplicateResult;
        const messageMap = {
          both: 'Bu firmada aynı e-posta ve telefon numarasına sahip bir temsilci zaten mevcut',
          email: 'Bu firmada aynı e-posta adresine sahip bir temsilci zaten mevcut',
          phone: 'Bu firmada aynı telefon numarasına sahip bir temsilci zaten mevcut',
        };
        throw new HttpException(
          {
            message: messageMap[matchedBy],
            error: 'CONFLICT',
            details: {
              duplicateOf: {
                id: duplicate.id,
                name: duplicate.name,
                phone: duplicate.phone,
                email: duplicate.email,
                matchedBy,
              },
            },
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    const contact = await this.prisma.customerContact.create({
      data: {
        customerId,
        name: dto.name,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        cardImage: dto.cardImage ?? null,
      },
    });

    await this.audit.log({
      userId: auditUser.id,
      userEmail: auditUser.email,
      entityType: 'customer_contact' as never,
      entityId: contact.id,
      action: 'create',
      after: contact,
    });

    return this.toResponse(contact);
  }

  async update(
    id: string,
    dto: UpdateCustomerContactDto,
    auditUser: { id: string; email: string },
  ): Promise<CustomerContact> {
    const existing = await this.prisma.customerContact.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Temsilci bulunamadı: ${id}`);
    }

    const updated = await this.prisma.customerContact.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.cardImage !== undefined && { cardImage: dto.cardImage }),
      },
    });

    await this.audit.log({
      userId: auditUser.id,
      userEmail: auditUser.email,
      entityType: 'customer_contact' as never,
      entityId: id,
      action: 'update',
      before: existing,
      after: updated,
    });

    return this.toResponse(updated);
  }

  async remove(
    id: string,
    auditUser: { id: string; email: string },
  ): Promise<void> {
    const existing = await this.prisma.customerContact.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Temsilci bulunamadı: ${id}`);
    }

    const linkedOpportunityCount = await this.prisma.opportunity.count({
      where: { contactId: id },
    });

    await this.audit.log({
      userId: auditUser.id,
      userEmail: auditUser.email,
      entityType: 'customer_contact' as never,
      entityId: id,
      action: 'delete',
      before: { ...existing, linkedOpportunityCount },
    });

    await this.prisma.customerContact.delete({ where: { id } });
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Müşteri bulunamadı: ${customerId}`);
    }
  }

  private async findDuplicate(
    customerId: string,
    dto: CreateCustomerContactDto,
  ): Promise<{ contact: { id: string; name: string; phone: string | null; email: string | null }; matchedBy: 'email' | 'phone' | 'both' } | null> {
    const contacts = await this.prisma.customerContact.findMany({
      where: { customerId },
    });

    const normalizedEmail = this.normalizeEmail(dto.email);
    const normalizedPhone = this.normalizePhone(dto.phone);

    for (const c of contacts) {
      const emailMatch = !!(normalizedEmail && this.normalizeEmail(c.email) === normalizedEmail);
      const phoneMatch = !!(normalizedPhone && this.normalizePhone(c.phone) === normalizedPhone);
      if (emailMatch || phoneMatch) {
        return {
          contact: c,
          matchedBy: emailMatch && phoneMatch ? 'both' : emailMatch ? 'email' : 'phone',
        };
      }
    }
    return null;
  }

  private normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.length > 0 ? digits : null;
  }

  private normalizeEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    return email.trim().toLowerCase();
  }

  private toResponse(contact: {
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
