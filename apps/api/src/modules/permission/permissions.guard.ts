import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@crm/shared';
import { hasContentWriteAccess, hasContentDeleteAccess, hasAiAnalystAccess } from '@crm/shared';
import { PERMISSION_KEY } from '@common/decorators/require-permission.decorator';
import { PermissionService } from './permission.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Erişim izniniz bulunmamaktadır');
    }

    if (user.role === 'admin') {
      return true;
    }

    const effective = await this.permissionService.getEffectivePermissions(user.id);
    const { permissions } = effective;

    const allowed = this.checkPermission(requiredPermission, permissions);

    if (!allowed) {
      throw new ForbiddenException('Bu işlem için gerekli yetkiniz bulunmamaktadır');
    }

    return true;
  }

  private checkPermission(required: Permission, permissions: Permission[]): boolean {
    switch (required) {
      case 'content_editor':
        return hasContentWriteAccess(permissions);
      case 'content_manager':
        return hasContentDeleteAccess(permissions);
      case 'ai_analyst':
        return hasAiAnalystAccess(permissions);
      case 'sales_reporter':
        return permissions.includes('sales_reporter');
      case 'manager_reporter':
        return permissions.includes('manager_reporter');
      default:
        return permissions.includes(required);
    }
  }
}
