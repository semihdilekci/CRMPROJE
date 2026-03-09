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

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { search?: string; role?: string }): Promise<User[]> {
    const where: {
      role?: string;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
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

  async create(dto: CreateUserDto): Promise<User> {
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
      },
      select: USER_SELECT,
    });

    this.logger.log(`User created by admin: ${user.email}`);
    return this.toUserResponse(user);
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

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findById(id);

    const updateData: { name?: string; role?: string; password?: string } = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.password) {
      updateData.password = await argon2.hash(dto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    this.logger.log(`User updated: ${user.email}`);
    return this.toUserResponse(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, _count: { select: { fairs: true } } },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user._count.fairs > 0) {
      throw new ForbiddenException('Bu kullanıcıya ait fuarlar bulunduğu için silinemez');
    }

    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User deleted: ${user.email}`);
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as User['role'],
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }
}
