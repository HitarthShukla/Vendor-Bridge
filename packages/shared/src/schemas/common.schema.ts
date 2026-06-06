import { z } from 'zod';

// ─── AI Assistant Schema ──────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

export const AiChatSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type AiChatInput = z.infer<typeof AiChatSchema>;

// ─── Pagination Schema ────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
