import { prisma } from '../../lib/db';
import { activityLogService } from '../activity-logs/activity-logs.service';
import { emitToProcurement, emitToApprover, emitToUser } from '../../lib/socket';

export const approvalService = {
  async requestApproval(quotationId: string, approverId: string, userId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { rfq: true, vendor: true },
    });
    if (!quotation) {
      throw Object.assign(new Error('Quotation not found'), { status: 404, code: 'QUOTATION_NOT_FOUND' });
    }

    const approval = await prisma.approval.create({
      data: {
        quotation_id: quotationId,
        approver_id: approverId,
      },
      include: { quotation: { include: { vendor: true, rfq: true } } },
    });

    // Update quotation status
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'UNDER_REVIEW' },
    });

    // Notify approver
    emitToApprover(approverId, 'notification:new', {
      type: 'APPROVAL_REQUESTED',
      title: 'Approval Required',
      message: `Quotation from ${quotation.vendor.company_name} for ${quotation.rfq.title} needs your approval`,
      entityId: approval.id,
    });

    await prisma.notification.create({
      data: {
        user_id: approverId,
        title: 'Approval Required',
        message: `Quotation from ${quotation.vendor.company_name} for ${quotation.rfq.title} needs your approval`,
        type: 'APPROVAL_REQUESTED',
        entity_id: approval.id,
      },
    });

    await activityLogService.log({
      userId,
      entityType: 'APPROVAL',
      entityId: approval.id,
      action: 'CREATED',
      metadata: { quotationId, approverId },
    });

    return approval;
  },

  async approve(approvalId: string, remarks: string | undefined, userId: string) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: { include: { vendor: true, rfq: true } } },
    });
    if (!approval) {
      throw Object.assign(new Error('Approval not found'), { status: 404, code: 'APPROVAL_NOT_FOUND' });
    }
    if (approval.approver_id !== userId) {
      throw Object.assign(new Error('Not authorized to approve'), { status: 403, code: 'NOT_AUTHORIZED' });
    }
    if (approval.status !== 'PENDING') {
      throw Object.assign(new Error('Approval already decided'), { status: 400, code: 'ALREADY_DECIDED' });
    }

    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: { status: 'APPROVED', remarks, decided_at: new Date() },
    });

    // Update quotation status
    await prisma.quotation.update({
      where: { id: approval.quotation_id },
      data: { status: 'SELECTED' },
    });

    // Emit events
    emitToProcurement('approval:decided', {
      quotationId: approval.quotation_id,
      status: 'APPROVED',
      rfqTitle: approval.quotation.rfq.title,
    });
    emitToProcurement('dashboard:stats', { type: 'APPROVAL_DECIDED' });

    await activityLogService.log({
      userId,
      entityType: 'APPROVAL',
      entityId: approvalId,
      action: 'APPROVED',
      metadata: { remarks, quotationId: approval.quotation_id },
    });

    return updated;
  },

  async reject(approvalId: string, remarks: string, userId: string) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: { include: { vendor: true, rfq: true } } },
    });
    if (!approval) {
      throw Object.assign(new Error('Approval not found'), { status: 404, code: 'APPROVAL_NOT_FOUND' });
    }
    if (approval.approver_id !== userId) {
      throw Object.assign(new Error('Not authorized'), { status: 403, code: 'NOT_AUTHORIZED' });
    }

    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: { status: 'REJECTED', remarks, decided_at: new Date() },
    });

    await prisma.quotation.update({
      where: { id: approval.quotation_id },
      data: { status: 'REJECTED' },
    });

    emitToProcurement('approval:decided', {
      quotationId: approval.quotation_id,
      status: 'REJECTED',
    });

    await activityLogService.log({
      userId,
      entityType: 'APPROVAL',
      entityId: approvalId,
      action: 'REJECTED',
      metadata: { remarks },
    });

    return updated;
  },

  async findPending(approverId: string) {
    return prisma.approval.findMany({
      where: { approver_id: approverId, status: 'PENDING' },
      include: {
        quotation: {
          include: {
            vendor: { select: { id: true, name: true, company_name: true } },
            rfq: { select: { id: true, title: true, rfq_number: true } },
            items: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  },

  async findAll() {
    return prisma.approval.findMany({
      include: {
        quotation: {
          include: {
            vendor: { select: { id: true, name: true, company_name: true } },
            rfq: { select: { id: true, title: true, rfq_number: true } },
          },
        },
        approver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  },
};
