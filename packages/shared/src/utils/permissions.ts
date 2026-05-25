import type { Permission, ReporterType } from '../constants/permissions';
import type { EffectivePermissions } from '../types/permission';

/**
 * Resolves effective permissions from user-level and team-level permissions using union.
 * content_manager implies content_editor.
 */
export function resolveEffectivePermissions(
  userPermissions: Permission[],
  teamPermissions: Permission[],
  allowedReportSlugs: string[],
  isAdmin: boolean,
): EffectivePermissions {
  if (isAdmin) {
    return {
      permissions: ['content_editor', 'content_manager', 'sales_reporter', 'manager_reporter', 'ai_analyst'],
      allowedReportSlugs,
    };
  }

  const merged = new Set<Permission>([...userPermissions, ...teamPermissions]);

  if (merged.has('content_manager')) {
    merged.add('content_editor');
  }

  return {
    permissions: Array.from(merged),
    allowedReportSlugs,
  };
}

export function hasContentWriteAccess(permissions: Permission[]): boolean {
  return permissions.includes('content_editor') || permissions.includes('content_manager');
}

export function hasContentDeleteAccess(permissions: Permission[]): boolean {
  return permissions.includes('content_manager');
}

export function hasReportAccess(permissions: Permission[]): boolean {
  return permissions.includes('sales_reporter') || permissions.includes('manager_reporter');
}

export function hasAiAnalystAccess(permissions: Permission[]): boolean {
  return permissions.includes('ai_analyst');
}

export function getAllowedReportSlugs(
  permissions: Permission[],
  reporterAccess: Record<ReporterType, string[]>,
): string[] {
  const slugs = new Set<string>();

  if (permissions.includes('sales_reporter')) {
    for (const slug of reporterAccess.sales_reporter) {
      slugs.add(slug);
    }
  }

  if (permissions.includes('manager_reporter')) {
    for (const slug of reporterAccess.manager_reporter) {
      slugs.add(slug);
    }
  }

  return Array.from(slugs);
}
