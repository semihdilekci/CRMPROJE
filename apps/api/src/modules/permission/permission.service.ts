import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  PERMISSIONS,
  Permission,
  ReporterType,
  EffectivePermissions,
  UserPermissionsResponse,
  TeamPermissionsResponse,
  ReporterReportAccessConfig,
  UpdateUserPermissionsDto,
  UpdateTeamPermissionsDto,
  UpdateReporterReportsDto,
  getAllowedReportSlugs,
  resolveEffectivePermissions,
} from '@crm/shared';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        teamId: true,
        userPermissions: { select: { permission: true } },
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const isAdmin = user.role === 'admin';

    const reporterAccess = await this.getReporterReportAccessConfig();
    const allowedSlugs = isAdmin
      ? this.getAllReportSlugs(reporterAccess)
      : getAllowedReportSlugs(
          user.userPermissions.map((p) => p.permission as Permission),
          reporterAccess,
        );

    if (isAdmin) {
      return resolveEffectivePermissions([], [], allowedSlugs, true);
    }

    const userPerms = user.userPermissions.map((p) => p.permission as Permission);

    let teamPerms: Permission[] = [];
    if (user.teamId) {
      const teamPermRecords = await this.prisma.teamPermission.findMany({
        where: { teamId: user.teamId },
        select: { permission: true },
      });
      teamPerms = teamPermRecords.map((p) => p.permission as Permission);
    }

    const mergedForSlugs = [
      ...new Set([...userPerms, ...teamPerms]),
    ] as Permission[];
    const effectiveSlugs = getAllowedReportSlugs(mergedForSlugs, reporterAccess);

    return resolveEffectivePermissions(userPerms, teamPerms, effectiveSlugs, false);
  }

  async getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const records = await this.prisma.userPermission.findMany({
      where: { userId },
      select: { permission: true },
    });

    return {
      userId,
      permissions: records.map((r) => r.permission as Permission),
    };
  }

  async updateUserPermissions(
    userId: string,
    dto: UpdateUserPermissionsDto,
  ): Promise<UserPermissionsResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    if (user.role === 'admin') {
      throw new BadRequestException('Admin kullanıcıların izinleri değiştirilemez');
    }

    this.validatePermissions(dto.permissions);

    await this.prisma.$transaction([
      this.prisma.userPermission.deleteMany({ where: { userId } }),
      ...dto.permissions.map((permission) =>
        this.prisma.userPermission.create({ data: { userId, permission } }),
      ),
    ]);

    this.logger.log(`User permissions updated: userId=${userId}, permissions=${dto.permissions.join(',')}`);

    return { userId, permissions: dto.permissions };
  }

  async getTeamPermissions(teamId: string): Promise<TeamPermissionsResponse> {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Ekip bulunamadı');

    const records = await this.prisma.teamPermission.findMany({
      where: { teamId },
      select: { permission: true },
    });

    return {
      teamId,
      permissions: records.map((r) => r.permission as Permission),
    };
  }

  async updateTeamPermissions(
    teamId: string,
    dto: UpdateTeamPermissionsDto,
  ): Promise<TeamPermissionsResponse> {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Ekip bulunamadı');

    this.validatePermissions(dto.permissions);

    await this.prisma.$transaction([
      this.prisma.teamPermission.deleteMany({ where: { teamId } }),
      ...dto.permissions.map((permission) =>
        this.prisma.teamPermission.create({ data: { teamId, permission } }),
      ),
    ]);

    this.logger.log(`Team permissions updated: teamId=${teamId}, permissions=${dto.permissions.join(',')}`);

    return { teamId, permissions: dto.permissions };
  }

  async getReporterReportAccessConfig(): Promise<ReporterReportAccessConfig> {
    const records = await this.prisma.reporterReportAccess.findMany({
      where: { enabled: true },
    });

    const config: ReporterReportAccessConfig = {
      sales_reporter: [],
      manager_reporter: [],
    };

    for (const record of records) {
      const type = record.reporterType as ReporterType;
      if (type === 'sales_reporter' || type === 'manager_reporter') {
        config[type].push(record.reportSlug);
      }
    }

    return config;
  }

  async getFullReporterReportMatrix(): Promise<
    { reporterType: ReporterType; reportSlug: string; enabled: boolean }[]
  > {
    const records = await this.prisma.reporterReportAccess.findMany({
      orderBy: [{ reporterType: 'asc' }, { reportSlug: 'asc' }],
    });

    return records.map((r) => ({
      reporterType: r.reporterType as ReporterType,
      reportSlug: r.reportSlug,
      enabled: r.enabled,
    }));
  }

  async updateReporterReports(dto: UpdateReporterReportsDto): Promise<
    { reporterType: ReporterType; reportSlug: string; enabled: boolean }[]
  > {
    await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.reporterReportAccess.upsert({
          where: {
            reporterType_reportSlug: {
              reporterType: entry.reporterType,
              reportSlug: entry.reportSlug,
            },
          },
          update: { enabled: entry.enabled },
          create: {
            reporterType: entry.reporterType,
            reportSlug: entry.reportSlug,
            enabled: entry.enabled,
          },
        }),
      ),
    );

    this.logger.log(`Reporter report access updated: ${dto.entries.length} entries`);

    return this.getFullReporterReportMatrix();
  }

  private validatePermissions(permissions: Permission[]): void {
    for (const perm of permissions) {
      if (!PERMISSIONS.includes(perm)) {
        throw new BadRequestException(`Geçersiz izin: ${perm}`);
      }
    }
  }

  private getAllReportSlugs(config: ReporterReportAccessConfig): string[] {
    return [...new Set([...config.sales_reporter, ...config.manager_reporter])];
  }
}
