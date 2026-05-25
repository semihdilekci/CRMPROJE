import { z } from 'zod';
import { PERMISSIONS, REPORTER_TYPES } from '../constants/permissions';

export const updateUserPermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSIONS)),
});

export const updateTeamPermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSIONS)),
});

export const updateReporterReportsSchema = z.object({
  entries: z.array(
    z.object({
      reporterType: z.enum(REPORTER_TYPES),
      reportSlug: z.string().min(1),
      enabled: z.boolean(),
    }),
  ),
});

export type UpdateUserPermissionsDto = z.infer<typeof updateUserPermissionsSchema>;
export type UpdateTeamPermissionsDto = z.infer<typeof updateTeamPermissionsSchema>;
export type UpdateReporterReportsDto = z.infer<typeof updateReporterReportsSchema>;
