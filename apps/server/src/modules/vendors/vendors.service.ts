import { prisma } from '../../lib/db';
import { buildPaginationMeta } from '../../lib/response';
import { activityLogService } from '../activity-logs/activity-logs.service';
import type { CreateVendorInput, UpdateVendorInput, PaginationInput } from '@vendorbridge/shared';

export const vendorService = {
  async create(input: CreateVendorInput, userId: string) {
    const vendor = await prisma.vendor.create({
      data: {
        name: input.name,
        company_name: input.companyName,
        email: input.email,
        phone: input.phone,
        gst_number: input.gstNumber,
        pan_number: input.panNumber,
        category: input.category,
        address: input.address as any,
        bank_details: input.bankDetails as any,
        notes: input.notes,
      },
    });

    await activityLogService.log({
      userId,
      entityType: 'VENDOR',
      entityId: vendor.id,
      action: 'CREATED',
      metadata: { vendorName: vendor.name, companyName: vendor.company_name },
    });

    return vendor;
  },

  async findAll(query: PaginationInput & { status?: string; category?: string }) {
    const { page, limit, sort, order, search, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { gst_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort || 'created_at']: order },
        select: {
          id: true,
          name: true,
          company_name: true,
          email: true,
          phone: true,
          gst_number: true,
          category: true,
          status: true,
          rating: true,
          total_orders: true,
          created_at: true,
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return { vendors, meta: buildPaginationMeta(page, limit, total) };
  },

  async findById(id: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        quotations: { take: 10, orderBy: { created_at: 'desc' } },
        purchase_orders: { take: 10, orderBy: { created_at: 'desc' } },
        invoices: { take: 10, orderBy: { created_at: 'desc' } },
      },
    });
    if (!vendor || vendor.deleted_at) {
      throw Object.assign(new Error('Vendor not found'), { status: 404, code: 'VENDOR_NOT_FOUND' });
    }
    return vendor;
  },

  async update(id: string, input: UpdateVendorInput, userId: string) {
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing || existing.deleted_at) {
      throw Object.assign(new Error('Vendor not found'), { status: 404, code: 'VENDOR_NOT_FOUND' });
    }

    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.companyName) data.company_name = input.companyName;
    if (input.email) data.email = input.email;
    if (input.phone) data.phone = input.phone;
    if (input.gstNumber) data.gst_number = input.gstNumber;
    if (input.panNumber) data.pan_number = input.panNumber;
    if (input.category) data.category = input.category;
    if (input.address) data.address = input.address;
    if (input.bankDetails) data.bank_details = input.bankDetails;
    if (input.status) data.status = input.status;
    if (input.notes !== undefined) data.notes = input.notes;

    const vendor = await prisma.vendor.update({ where: { id }, data });

    await activityLogService.log({
      userId,
      entityType: 'VENDOR',
      entityId: vendor.id,
      action: 'UPDATED',
      metadata: { changes: Object.keys(data) },
    });

    return vendor;
  },

  async softDelete(id: string, userId: string) {
    const vendor = await prisma.vendor.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await activityLogService.log({
      userId,
      entityType: 'VENDOR',
      entityId: vendor.id,
      action: 'DELETED',
    });

    return vendor;
  },
};
