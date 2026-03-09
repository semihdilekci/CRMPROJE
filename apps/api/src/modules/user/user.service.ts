import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { User, UpdateUserDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';

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

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.toUserResponse(u));
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

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
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
