import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Ekip adı en az 2 karakter olmalıdır'),
  description: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = createTeamSchema
  .extend({
    name: createTeamSchema.shape.name.optional(),
  })
  .partial();

export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;

