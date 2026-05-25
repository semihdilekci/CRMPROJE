import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const AI_CHAT_PROVIDER = 'gemini' as const;

const chatQueryObjectSchema = z.object({
  message: z.string().min(1, 'Mesaj zorunludur').max(4000, 'Mesaj en fazla 4000 karakter olabilir'),
  messages: z.array(chatMessageSchema).max(20).optional(),
  provider: z.literal(AI_CHAT_PROVIDER).optional().default(AI_CHAT_PROVIDER),
});

/** String veya obje kabul eder; string gelirse { message: string }'e dönüştürür */
export const chatQuerySchema = z.preprocess((val) => {
  if (typeof val === 'string') return { message: val.trim() };
  if (val && typeof val === 'object' && 'message' in val) return val;
  return val;
}, chatQueryObjectSchema);

export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
