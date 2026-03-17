import { z } from 'zod';

export const createOpportunityNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Not içeriği zorunludur')
    .max(5000, 'Not en fazla 5000 karakter olabilir'),
});

export const updateOpportunityNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Not içeriği zorunludur')
    .max(5000, 'Not en fazla 5000 karakter olabilir'),
});

export type CreateOpportunityNoteInput = z.infer<typeof createOpportunityNoteSchema>;
export type UpdateOpportunityNoteInput = z.infer<typeof updateOpportunityNoteSchema>;
