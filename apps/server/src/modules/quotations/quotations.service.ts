import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../lib/db';
import { generateDocumentId } from '../../lib/documentId';
import { activityLogService } from '../activity-logs/activity-logs.service';
import { emitToProcurement } from '../../lib/socket';
import type { CreateQuotationInput } from '@vendorbridge/shared';

export const quotationService = {
  async create(input: CreateQuotationInput, vendorId: string, userId: string) {
    // Verify vendor is assigned to this RFQ
    const assignment = await prisma.rfqVendor.findUnique({
      where: { rfq_id_vendor_id: { rfq_id: input.rfqId, vendor_id: vendorId } },
    });
    if (!assignment) {
      throw Object.assign(new Error('Vendor is not assigned to this RFQ'), { status: 403, code: 'NOT_ASSIGNED' });
    }

    // Check RFQ is published
    const rfq = await prisma.rfq.findUnique({ where: { id: input.rfqId } });
    if (!rfq || rfq.status !== 'PUBLISHED') {
      throw Object.assign(new Error('RFQ is not open for quotations'), { status: 400, code: 'RFQ_NOT_PUBLISHED' });
    }

    const quotationNumber = await generateDocumentId('QTN', 'quotations');

    // Calculate item totals
    const items = input.items.map((item) => {
      const totalPrice = item.unitPrice * item.quantity * (1 + item.taxPercent / 100);
      return {
        rfq_item_id: item.rfqItemId,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        tax_percent: item.taxPercent,
        total_price: Math.round(totalPrice * 100) / 100,
        notes: item.notes,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

    const quotation = await prisma.quotation.create({
      data: {
        quotation_number: quotationNumber,
        rfq_id: input.rfqId,
        vendor_id: vendorId,
        delivery_days: input.deliveryDays,
        validity_days: input.validityDays,
        currency: input.currency,
        notes: input.notes,
        total_amount: totalAmount,
        items: { create: items },
      },
      include: { items: true, vendor: { select: { id: true, name: true, company_name: true } } },
    });

    await activityLogService.log({
      userId,
      entityType: 'QUOTATION',
      entityId: quotation.id,
      action: 'CREATED',
      metadata: { quotationNumber, rfqId: input.rfqId, totalAmount },
    });

    return quotation;
  },

  async submit(quotationId: string, userId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { vendor: true },
    });
    if (!quotation) {
      throw Object.assign(new Error('Quotation not found'), { status: 404, code: 'QUOTATION_NOT_FOUND' });
    }
    if (quotation.status !== 'DRAFT') {
      throw Object.assign(new Error('Quotation already submitted'), { status: 400, code: 'ALREADY_SUBMITTED' });
    }

    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'SUBMITTED', submitted_at: new Date() },
    });

    // Notify procurement
    emitToProcurement('quotation:received', {
      rfqId: quotation.rfq_id,
      vendorName: quotation.vendor.name,
      quotationId,
    });

    await activityLogService.log({
      userId,
      entityType: 'QUOTATION',
      entityId: quotationId,
      action: 'STATUS_CHANGED',
      metadata: { from: 'DRAFT', to: 'SUBMITTED' },
    });

    return updated;
  },

  async findByRfq(rfqId: string) {
    return prisma.quotation.findMany({
      where: { rfq_id: rfqId },
      include: {
        vendor: { select: { id: true, name: true, company_name: true, rating: true } },
        items: { include: { rfq_item: true } },
      },
      orderBy: { total_amount: 'asc' },
    });
  },

  async compare(rfqId: string) {
    const quotations = await prisma.quotation.findMany({
      where: { rfq_id: rfqId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'SELECTED'] } },
      include: {
        vendor: { select: { id: true, name: true, company_name: true, rating: true } },
        items: { include: { rfq_item: true } },
      },
      orderBy: { total_amount: 'asc' },
    });

    // Find lowest price and shortest delivery
    const lowestPrice = quotations.length > 0 ? quotations[0]!.total_amount : null;
    const shortestDelivery = quotations.length > 0
      ? Math.min(...quotations.map((q) => q.delivery_days))
      : null;

    return {
      quotations,
      analysis: {
        totalQuotations: quotations.length,
        lowestPrice,
        shortestDelivery,
        lowestPriceVendor: quotations[0]?.vendor?.company_name ?? null,
      },
    };
  },

  async select(quotationId: string, userId: string) {
    const quotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'SELECTED' },
    });

    await activityLogService.log({
      userId,
      entityType: 'QUOTATION',
      entityId: quotationId,
      action: 'STATUS_CHANGED',
      metadata: { from: quotation.status, to: 'SELECTED' },
    });

    return quotation;
  },
};
