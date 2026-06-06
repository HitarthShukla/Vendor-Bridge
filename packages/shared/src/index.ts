// ─── VendorBridge Shared Package ──────────────────────────────────────────────
// Single source of truth for validation schemas and TypeScript types.
// Consumed by both apps/server and apps/client.

// Auth
export {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  type LoginInput,
  type RegisterInput,
  type RefreshTokenInput,
} from './schemas/auth.schema';

// Vendors
export {
  CreateVendorSchema,
  UpdateVendorSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
  type Address,
  type BankDetails,
} from './schemas/vendor.schema';

// RFQ
export {
  CreateRfqSchema,
  UpdateRfqSchema,
  PublishRfqSchema,
  type CreateRfqInput,
  type UpdateRfqInput,
  type RfqItemInput,
} from './schemas/rfq.schema';

// Quotations
export {
  CreateQuotationSchema,
  SubmitQuotationSchema,
  type CreateQuotationInput,
  type QuotationItemInput,
} from './schemas/quotation.schema';

// Approvals, Purchase Orders, Invoices
export {
  ApproveSchema,
  RejectSchema,
  CreatePurchaseOrderSchema,
  GenerateInvoiceSchema,
  SendInvoiceEmailSchema,
  type ApproveInput,
  type RejectInput,
  type CreatePurchaseOrderInput,
  type GenerateInvoiceInput,
  type SendInvoiceEmailInput,
} from './schemas/approval-po-invoice.schema';

// Common
export {
  AiChatSchema,
  ChatMessageSchema,
  PaginationSchema,
  type ChatMessage,
  type AiChatInput,
  type PaginationInput,
  type PaginationMeta,
} from './schemas/common.schema';

// ─── Shared Enums (mirroring Prisma enums for frontend use) ──────────────────

export const UserRole = {
  ADMIN: 'ADMIN',
  PROCUREMENT_OFFICER: 'PROCUREMENT_OFFICER',
  MANAGER: 'MANAGER',
  VENDOR: 'VENDOR',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const VendorStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLACKLISTED: 'BLACKLISTED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;
export type VendorStatus = (typeof VendorStatus)[keyof typeof VendorStatus];

export const RfqStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type RfqStatus = (typeof RfqStatus)[keyof typeof RfqStatus];

export const QuotationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED',
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ESCALATED: 'ESCALATED',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_DELIVERED: 'PARTIALLY_DELIVERED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const InvoiceStatus = {
  GENERATED: 'GENERATED',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
