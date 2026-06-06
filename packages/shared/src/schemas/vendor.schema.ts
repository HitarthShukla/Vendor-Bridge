import { z } from 'zod';

// ─── Vendor Schemas ───────────────────────────────────────────────────────────

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  country: z.string().default('India'),
});

const BankDetailsSchema = z.object({
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  accountHolderName: z.string().min(1),
});

export const CreateVendorSchema = z.object({
  name: z.string().min(2).max(100),
  companyName: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  gstNumber: z.string().regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GST number'
  ),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number')
    .optional(),
  category: z.string().min(1),
  address: AddressSchema,
  bankDetails: BankDetailsSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_VERIFICATION']).optional(),
});

export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type BankDetails = z.infer<typeof BankDetailsSchema>;
