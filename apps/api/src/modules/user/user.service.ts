import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { User, UpdateUserDto, CreateUserDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';
import * as argon2 from 'argon2';
import { AuditService } from '@modules/audit/audit.service';

export interface AuditUser {
  id: string;
  email: string;
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  teamId: true,
  team: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async findAll(filters?: { search?: string; role?: string; teamId?: string }): Promise<User[]> {
    const where: Record<string, unknown> = {};

    if (filters?.role) {
      where['role'] = filters.role;
    }
    if (filters?.teamId) {
      where['teamId'] = filters.teamId;
    }
    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      where['OR'] = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.toUserResponse(u));
  }

  async create(dto: CreateUserDto, auditUser?: AuditUser): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role ?? 'user',
        teamId: dto.teamId,
        phone: dto.phone ?? null,
      },
      select: USER_SELECT,
    });
    const result = this.toUserResponse(user);
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'user',
      entityId: user.id,
      action: 'create',
      after: result,
    });
    this.logger.log(`User created by admin: ${user.email}`);
    return result;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return this.toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, auditUser?: AuditUser): Promise<User> {
    const old = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!old) throw new NotFoundException('Kullanıcı bulunamadı');

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData['name'] = dto.name;
    if (dto.role !== undefined) updateData['role'] = dto.role;
    if (dto.teamId !== undefined) updateData['teamId'] = dto.teamId;
    if (dto.phone !== undefined) updateData['phone'] = dto.phone ?? null;
    if (dto.password) {
      updateData['password'] = await argon2.hash(dto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
    const result = this.toUserResponse(user);
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'user',
      entityId: id,
      action: 'update',
      before: this.toUserResponse(old),
      after: result,
    });
    this.logger.log(`User updated: ${user.email}`);
    return result;
  }

  async remove(id: string, auditUser?: AuditUser): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...USER_SELECT, _count: { select: { fairs: true } } },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user._count.fairs > 0) {
      throw new ForbiddenException('Bu kullanıcıya ait fuarlar bulunduğu için silinemez');
    }
    const before = this.toUserResponse(user);
    await this.prisma.user.delete({ where: { id } });
    await this.auditService.log({
      userId: auditUser?.id,
      userEmail: auditUser?.email,
      entityType: 'user',
      entityId: id,
      action: 'delete',
      before,
    });
    this.logger.log(`User deleted: ${user.email}`);
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string | null;
    teamId: string | null;
    team: { id: string; name: string } | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as User['role'],
      phone: user.phone ?? null,
      teamId: user.teamId,
      teamName: user.team?.name ?? null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }
}
