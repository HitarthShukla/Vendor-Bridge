import { prisma } from '../../lib/db';
import { generateDocumentId } from '../../lib/documentId';
import { buildPaginationMeta } from '../../lib/response';
import { activityLogService } from '../activity-logs/activity-logs.service';
import type { PaginationInput } from '@vendorbridge/shared';

export const purchaseOrderService = {
  async create(quotationId: string, terms: string | undefined, deliveryDate: string | undefined, userId: string) {
    // Verify quotation is approved
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true, vendor: true, approval: true },
    });
    if (!quotation) {
      throw Object.assign(new Error('Quotation not found'), { status: 404, code: 'QUOTATION_NOT_FOUND' });
    }
    if (quotation.status !== 'SELECTED' || !quotation.approval || quotation.approval.status !== 'APPROVED') {
      throw Object.assign(new Error('Quotation must be approved before creating PO'), { status: 400, code: 'NOT_APPROVED' });
    }

    const poNumber = await generateDocumentId('PO', 'purchase_orders');

    // Calculate totals from quotation items
    const subtotal = quotation.items.reduce((sum, item) => {
      return sum + Number(item.unit_price) * Number(item.quantity);
    }, 0);
    const taxTotal = quotation.items.reduce((sum, item) => {
      return sum + Number(item.unit_price) * Number(item.quantity) * (Number(item.tax_percent) / 100);
    }, 0);
    const grandTotal = subtotal + taxTotal;

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: poNumber,
        quotation_id: quotationId,
        vendor_id: quotation.vendor_id,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_total: Math.round(taxTotal * 100) / 100,
        grand_total: Math.round(grandTotal * 100) / 100,
        terms,
        delivery_date: deliveryDate ? new Date(deliveryDate) : null,
      },
    });

    // Increment vendor order count
    await prisma.vendor.update({
      where: { id: quotation.vendor_id },
      data: { total_orders: { increment: 1 } },
    });

    await activityLogService.log({
      userId,
      entityType: 'PURCHASE_ORDER',
      entityId: po.id,
      action: 'CREATED',
      metadata: { poNumber, vendorId: quotation.vendor_id, grandTotal },
    });

    return po;
  },

  async confirm(poId: string, userId: string) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'CONFIRMED' },
    });

    // TODO: Queue blockchain anchoring job here

    await activityLogService.log({
      userId,
      entityType: 'PURCHASE_ORDER',
      entityId: poId,
      action: 'STATUS_CHANGED',
      metadata: { from: 'DRAFT', to: 'CONFIRMED' },
    });

    return po;
  },

  async findAll(query: PaginationInput & { status?: string; vendorId?: string }) {
    const { page, limit, sort, order, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.vendorId) where.vendor_id = filters.vendorId;

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort || 'created_at']: order },
        include: {
          vendor: { select: { id: true, name: true, company_name: true } },
          _count: { select: { invoices: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { purchaseOrders: pos, meta: buildPaginationMeta(page, limit, total) };
  },

  async findById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        invoices: true,
      },
    });
    if (!po || po.deleted_at) {
      throw Object.assign(new Error('Purchase order not found'), { status: 404, code: 'PO_NOT_FOUND' });
    }
    return po;
  },
};
