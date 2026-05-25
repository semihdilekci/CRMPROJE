import { z } from 'zod';

export const FEEDBACK_CATEGORIES = ['idea', 'bug', 'question'] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const createFeedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, {
    errorMap: () => ({ message: 'Geçersiz geri bildirim kategorisi' }),
  }),
  message: z
    .string()
    .trim()
    .min(10, 'Mesaj en az 10 karakter olmalıdır')
    .max(5000, 'Mesaj en fazla 5000 karakter olabilir'),
});

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;

export const feedbackListQuerySchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type FeedbackListQueryDto = z.infer<typeof feedbackListQuerySchema>;
