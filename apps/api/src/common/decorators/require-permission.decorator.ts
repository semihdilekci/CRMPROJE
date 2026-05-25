import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@crm/shared';

export const PERMISSION_KEY = 'required_permission';

/**
 * Decorator to require a specific permission for a route handler.
 * Used together with PermissionsGuard.
 * Admin users always bypass this check.
 */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);
