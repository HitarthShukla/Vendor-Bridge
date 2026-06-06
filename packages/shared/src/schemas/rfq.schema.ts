import { z } from 'zod';

// ─── RFQ Schemas ──────────────────────────────────────────────────────────────

const RfqItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().optional(),
});

export const CreateRfqSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  deadline: z.string().datetime({ message: 'Invalid deadline format' }),
  items: z.array(RfqItemSchema).min(1, 'At least one item is required'),
  vendorIds: z.array(z.string().uuid()).min(1, 'At least one vendor must be assigned'),
});

export const UpdateRfqSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  deadline: z.string().datetime().optional(),
  items: z.array(RfqItemSchema).min(1).optional(),
});

export const PublishRfqSchema = z.object({
  rfqId: z.string().uuid(),
});

export type CreateRfqInput = z.infer<typeof CreateRfqSchema>;
export type UpdateRfqInput = z.infer<typeof UpdateRfqSchema>;
export type RfqItemInput = z.infer<typeof RfqItemSchema>;
