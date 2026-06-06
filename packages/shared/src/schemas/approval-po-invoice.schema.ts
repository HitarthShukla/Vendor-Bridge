import { z } from 'zod';

// ─── Approval Schemas ─────────────────────────────────────────────────────────

export const ApproveSchema = z.object({
  remarks: z.string().max(1000).optional(),
});

export const RejectSchema = z.object({
  remarks: z.string().min(1, 'Rejection reason is required').max(1000),
});

export type ApproveInput = z.infer<typeof ApproveSchema>;
export type RejectInput = z.infer<typeof RejectSchema>;

// ─── Purchase Order Schemas ───────────────────────────────────────────────────

export const CreatePurchaseOrderSchema = z.object({
  quotationId: z.string().uuid('Invalid quotation ID'),
  terms: z.string().max(2000).optional(),
  deliveryDate: z.string().datetime().optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;

// ─── Invoice Schemas ──────────────────────────────────────────────────────────

export const GenerateInvoiceSchema = z.object({
  purchaseOrderId: z.string().uuid('Invalid purchase order ID'),
  dueDate: z.string().datetime('Invalid due date'),
});

export const SendInvoiceEmailSchema = z.object({
  invoiceId: z.string().uuid(),
  recipientEmail: z.string().email().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;
export type SendInvoiceEmailInput = z.infer<typeof SendInvoiceEmailSchema>;
