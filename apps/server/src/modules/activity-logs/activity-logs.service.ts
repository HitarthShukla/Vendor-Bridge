import { prisma } from '../../lib/db';

interface LogInput {
  userId: string;
  entityType: string;
  entityId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'APPROVED' | 'REJECTED' | 'SENT' | 'DOWNLOADED' | 'VIEWED';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const activityLogService = {
  async log(input: LogInput) {
    return prisma.activityLog.create({
      data: {
        user_id: input.userId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        metadata: input.metadata as any,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
      },
    });
  },

  async findByEntity(entityType: string, entityId: string) {
    return prisma.activityLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  },

  async findRecent(limit = 20) {
    return prisma.activityLog.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  },
};
