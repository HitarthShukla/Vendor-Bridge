import { prisma } from '../../lib/db';
import { generateDocumentId } from '../../lib/documentId';
import { buildPaginationMeta } from '../../lib/response';
import { activityLogService } from '../activity-logs/activity-logs.service';
import type { PaginationInput } from '@vendorbridge/shared';

export const invoiceService = {
  async generate(purchaseOrderId: string, dueDate: string, userId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { vendor: true },
    });
    if (!po || po.deleted_at) {
      throw Object.assign(new Error('Purchase order not found'), { status: 404, code: 'PO_NOT_FOUND' });
    }

    const invoiceNumber = await generateDocumentId('INV', 'invoices');

    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        purchase_order_id: purchaseOrderId,
        vendor_id: po.vendor_id,
        subtotal: po.subtotal,
        tax_total: po.tax_total,
        grand_total: po.grand_total,
        due_date: new Date(dueDate),
      },
      include: { vendor: true, purchase_order: true },
    });

    await activityLogService.log({
      userId,
      entityType: 'INVOICE',
      entityId: invoice.id,
      action: 'CREATED',
      metadata: { invoiceNumber, poNumber: po.po_number },
    });

    return invoice;
  },

  async findAll(query: PaginationInput & { status?: string; vendorId?: string }) {
    const { page, limit, sort, order, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.vendorId) where.vendor_id = filters.vendorId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort || 'created_at']: order },
        include: {
          vendor: { select: { id: true, name: true, company_name: true } },
          purchase_order: { select: { id: true, po_number: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, meta: buildPaginationMeta(page, limit, total) };
  },

  async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchase_order: true,
      },
    });
    if (!invoice || invoice.deleted_at) {
      throw Object.assign(new Error('Invoice not found'), { status: 404, code: 'INVOICE_NOT_FOUND' });
    }
    return invoice;
  },

  async markSent(id: string, userId: string) {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'SENT', email_sent_at: new Date() },
    });

    await activityLogService.log({
      userId,
      entityType: 'INVOICE',
      entityId: id,
      action: 'SENT',
    });

    return invoice;
  },

  async markPaid(id: string, userId: string) {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'PAID', paid_at: new Date() },
    });

    await activityLogService.log({
      userId,
      entityType: 'INVOICE',
      entityId: id,
      action: 'STATUS_CHANGED',
      metadata: { to: 'PAID' },
    });

    return invoice;
  },
};
