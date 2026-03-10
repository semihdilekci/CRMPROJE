import { z } from 'zod';
import { CONVERSION_RATES, CURRENCIES } from '../constants/enums';

export const createOpportunitySchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçimi zorunludur'),
  budgetRaw: z.string().nullable().optional(),
  budgetCurrency: z.enum(CURRENCIES).nullable().optional(),
  conversionRate: z.enum(CONVERSION_RATES).nullable().optional(),
  products: z.array(z.string()).optional().default([]),
  cardImage: z.string().nullable().optional(),
});

export type CreateOpportunityDto = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = createOpportunitySchema.partial();

export type UpdateOpportunityDto = z.infer<typeof updateOpportunitySchema>;
