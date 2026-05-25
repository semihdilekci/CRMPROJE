import type { Permission, ReporterType } from '../constants/permissions';

export type { Permission, ReporterType };

export interface UserPermissionRecord {
  id: string;
  userId: string;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
}

export interface TeamPermissionRecord {
  id: string;
  teamId: string;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
}

export interface EffectivePermissions {
  permissions: Permission[];
  allowedReportSlugs: string[];
}

export interface ReporterReportAccessEntry {
  reporterType: ReporterType;
  reportSlug: string;
  enabled: boolean;
}

export interface ReporterReportAccessConfig {
  sales_reporter: string[];
  manager_reporter: string[];
}

export interface UserPermissionsResponse {
  userId: string;
  permissions: Permission[];
}

export interface TeamPermissionsResponse {
  teamId: string;
  permissions: Permission[];
}
