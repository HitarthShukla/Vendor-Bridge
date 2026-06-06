import { prisma } from '../../lib/db';
import { generateDocumentId } from '../../lib/documentId';
import { buildPaginationMeta } from '../../lib/response';
import { activityLogService } from '../activity-logs/activity-logs.service';
import { emitToProcurement, emitToUser, emitToRfqRoom } from '../../lib/socket';
import type { CreateRfqInput, UpdateRfqInput, PaginationInput } from '@vendorbridge/shared';

export const rfqService = {
  async create(input: CreateRfqInput, userId: string) {
    const rfqNumber = await generateDocumentId('RFQ', 'rfqs');

    const rfq = await prisma.rfq.create({
      data: {
        rfq_number: rfqNumber,
        title: input.title,
        description: input.description,
        deadline: new Date(input.deadline),
        created_by: userId,
        items: {
          create: input.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
          })),
        },
        vendors: {
          create: input.vendorIds.map((vendorId) => ({
            vendor_id: vendorId,
          })),
        },
      },
      include: { items: true, vendors: { include: { vendor: true } } },
    });

    await activityLogService.log({
      userId,
      entityType: 'RFQ',
      entityId: rfq.id,
      action: 'CREATED',
      metadata: { rfqNumber, title: rfq.title, itemCount: input.items.length },
    });

    return rfq;
  },

  async findAll(query: PaginationInput & { status?: string }) {
    const { page, limit, sort, order, search, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { rfq_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rfqs, total] = await Promise.all([
      prisma.rfq.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort || 'created_at']: order },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          items: true,
          vendors: { include: { vendor: { select: { id: true, name: true, company_name: true } } } },
          _count: { select: { quotations: true } },
        },
      }),
      prisma.rfq.count({ where }),
    ]);

    return { rfqs, meta: buildPaginationMeta(page, limit, total) };
  },

  async findById(id: string) {
    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        items: { include: { quotation_items: true } },
        vendors: { include: { vendor: true } },
        quotations: {
          include: {
            vendor: { select: { id: true, name: true, company_name: true } },
            items: true,
          },
        },
        attachments: true,
      },
    });
    if (!rfq || rfq.deleted_at) {
      throw Object.assign(new Error('RFQ not found'), { status: 404, code: 'RFQ_NOT_FOUND' });
    }
    return rfq;
  },

  async update(id: string, input: UpdateRfqInput, userId: string) {
    const rfq = await prisma.rfq.findUnique({ where: { id } });
    if (!rfq || rfq.deleted_at) {
      throw Object.assign(new Error('RFQ not found'), { status: 404, code: 'RFQ_NOT_FOUND' });
    }
    if (rfq.status !== 'DRAFT') {
      throw Object.assign(new Error('Can only edit RFQs in DRAFT status'), { status: 400, code: 'RFQ_NOT_DRAFT' });
    }

    const updated = await prisma.rfq.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        deadline: input.deadline ? new Date(input.deadline) : undefined,
      },
      include: { items: true },
    });

    await activityLogService.log({
      userId,
      entityType: 'RFQ',
      entityId: id,
      action: 'UPDATED',
    });

    return updated;
  },

  async publish(id: string, userId: string) {
    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: { vendors: { include: { vendor: { include: { user: true } } } } },
    });
    if (!rfq || rfq.deleted_at) {
      throw Object.assign(new Error('RFQ not found'), { status: 404, code: 'RFQ_NOT_FOUND' });
    }
    if (rfq.status !== 'DRAFT') {
      throw Object.assign(new Error('Can only publish DRAFT RFQs'), { status: 400, code: 'RFQ_NOT_DRAFT' });
    }

    const updated = await prisma.rfq.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    // Notify assigned vendors
    for (const rv of rfq.vendors) {
      if (rv.vendor.user_id) {
        emitToUser(rv.vendor.user_id, 'notification:new', {
          type: 'RFQ_PUBLISHED',
          title: 'New RFQ Available',
          message: `You have been invited to quote on ${rfq.title}`,
          entityId: rfq.id,
        });

        await prisma.notification.create({
          data: {
            user_id: rv.vendor.user_id,
            title: 'New RFQ Available',
            message: `You have been invited to quote on ${rfq.title}`,
            type: 'RFQ_PUBLISHED',
            entity_id: rfq.id,
          },
        });
      }
    }

    emitToRfqRoom(id, 'rfq:updated', { rfqId: id, status: 'PUBLISHED' });
    emitToProcurement('dashboard:stats', { type: 'RFQ_PUBLISHED' });

    await activityLogService.log({
      userId,
      entityType: 'RFQ',
      entityId: id,
      action: 'STATUS_CHANGED',
      metadata: { from: 'DRAFT', to: 'PUBLISHED' },
    });

    return updated;
  },

  async close(id: string, userId: string) {
    const rfq = await prisma.rfq.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    emitToRfqRoom(id, 'rfq:updated', { rfqId: id, status: 'CLOSED' });

    await activityLogService.log({
      userId,
      entityType: 'RFQ',
      entityId: id,
      action: 'STATUS_CHANGED',
      metadata: { from: 'PUBLISHED', to: 'CLOSED' },
    });

    return rfq;
  },

  /** Get RFQs assigned to a specific vendor */
  async findByVendor(vendorId: string, query: PaginationInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [rfqs, total] = await Promise.all([
      prisma.rfq.findMany({
        where: {
          vendors: { some: { vendor_id: vendorId } },
          status: { in: ['PUBLISHED', 'CLOSED'] },
          deleted_at: null,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          items: true,
          _count: { select: { quotations: true } },
        },
      }),
      prisma.rfq.count({
        where: {
          vendors: { some: { vendor_id: vendorId } },
          status: { in: ['PUBLISHED', 'CLOSED'] },
          deleted_at: null,
        },
      }),
    ]);

    return { rfqs, meta: buildPaginationMeta(page, limit, total) };
  },
};
