import { z } from 'zod';

// ─── Quotation Schemas ────────────────────────────────────────────────────────

const QuotationItemSchema = z.object({
  rfqItemId: z.string().uuid('Invalid RFQ item ID'),
  unitPrice: z.number().positive('Unit price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  taxPercent: z.number().min(0).max(100).default(18),
  notes: z.string().max(500).optional(),
});

export const CreateQuotationSchema = z.object({
  rfqId: z.string().uuid('Invalid RFQ ID'),
  deliveryDays: z.number().int().positive('Delivery days must be positive'),
  validityDays: z.number().int().positive('Validity days must be positive').default(30),
  currency: z.string().default('INR'),
  notes: z.string().max(2000).optional(),
  items: z.array(QuotationItemSchema).min(1, 'At least one item is required'),
});

export const SubmitQuotationSchema = z.object({
  quotationId: z.string().uuid(),
});

export type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;
export type QuotationItemInput = z.infer<typeof QuotationItemSchema>;
