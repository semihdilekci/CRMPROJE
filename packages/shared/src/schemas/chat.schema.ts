import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const chatQuerySchema = z.object({
  message: z.string().min(1, 'Mesaj zorunludur').max(4000, 'Mesaj en fazla 4000 karakter olabilir'),
  messages: z.array(chatMessageSchema).max(20).optional(),
});

export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
