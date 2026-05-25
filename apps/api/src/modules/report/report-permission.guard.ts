import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionService } from '@modules/permission/permission.service';

/**
 * Guard that checks if the authenticated user has access to the requested report.
 * Admin users always bypass this check.
 * The report slug is inferred from the request path (e.g. /reports/executive-summary → executive-summary).
 */
@Injectable()
export class ReportPermissionGuard implements CanActivate {
  constructor(private readonly permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user, path } = context.switchToHttp().getRequest<{
      user: { id: string; role: string };
      path: string;
    }>();

    if (!user) {
      throw new ForbiddenException('Erişim izniniz bulunmamaktadır');
    }

    if (user.role === 'admin') {
      return true;
    }

    const slug = this.extractSlugFromPath(path);
    if (!slug) {
      return true;
    }

    const effective = await this.permissionService.getEffectivePermissions(user.id);

    const hasAccess =
      effective.allowedReportSlugs.includes(slug) ||
      effective.permissions.includes('sales_reporter') ||
      effective.permissions.includes('manager_reporter');

    if (!hasAccess) {
      throw new ForbiddenException('Bu raporu görüntüleme yetkiniz bulunmamaktadır');
    }

    if (!effective.allowedReportSlugs.includes(slug)) {
      throw new ForbiddenException('Bu raporu görüntüleme yetkiniz bulunmamaktadır');
    }

    return true;
  }

  private extractSlugFromPath(path: string): string | null {
    const match = /\/reports\/([a-z0-9-]+)/.exec(path);
    return match?.[1] ?? null;
  }
}
