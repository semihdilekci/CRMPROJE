import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { TeamWithUserCount, CreateTeamDto, UpdateTeamDto } from '@crm/shared';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { search?: string; active?: boolean }): Promise<TeamWithUserCount[]> {
    const where: Record<string, unknown> = {};

    if (filters?.search?.trim()) {
      where['name'] = { contains: filters.search.trim(), mode: 'insensitive' };
    }
    if (filters?.active !== undefined) {
      where['active'] = filters.active;
    }

    const teams = await this.prisma.team.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });

    return teams.map((t) => this.toResponse(t));
  }

  async findById(id: string): Promise<TeamWithUserCount> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!team) throw new NotFoundException('Ekip bulunamadı');
    return this.toResponse(team);
  }

  async create(dto: CreateTeamDto): Promise<TeamWithUserCount> {
    const existing = await this.prisma.team.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existing) throw new ConflictException('Bu isimde bir ekip zaten var');

    const team = await this.prisma.team.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        active: dto.active ?? true,
      },
      include: { _count: { select: { users: true } } },
    });
    this.logger.log(`Team created: ${team.name}`);
    return this.toResponse(team);
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamWithUserCount> {
    const old = await this.prisma.team.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Ekip bulunamadı');

    if (dto.name !== undefined) {
      const existing = await this.prisma.team.findFirst({
        where: { name: dto.name.trim(), id: { not: id } },
      });
      if (existing) throw new ConflictException('Bu isimde başka bir ekip zaten var');
    }

    const team = await this.prisma.team.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: { _count: { select: { users: true } } },
    });
    this.logger.log(`Team updated: ${team.name}`);
    return this.toResponse(team);
  }

  async remove(id: string): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!team) throw new NotFoundException('Ekip bulunamadı');

    if (team._count.users > 0) {
      throw new ForbiddenException(
        `Bu ekibe ${team._count.users} kullanıcı bağlı olduğu için silinemez. Önce kullanıcıları başka bir ekibe taşıyın.`
      );
    }

    await this.prisma.team.delete({ where: { id } });
    this.logger.log(`Team deleted: ${team.name}`);
  }

  private toResponse(team: {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { users: number };
  }): TeamWithUserCount {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      active: team.active,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      userCount: team._count.users,
    };
  }
}
