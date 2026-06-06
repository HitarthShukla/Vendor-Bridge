import { prisma } from '../../lib/db';
import { redis } from '../../lib/redis';
import { activityLogService } from '../activity-logs/activity-logs.service';
import type { ChatMessage } from '@vendorbridge/shared';

async function getProcurementContext(userId: string, role: string) {
  const [pendingApprovals, activeRfqs, recentOrders, totalVendors] = await Promise.all([
    prisma.approval.count({ where: { status: 'PENDING', approver_id: role === 'MANAGER' ? userId : undefined } }),
    prisma.rfq.count({ where: { status: 'PUBLISHED' } }),
    prisma.purchaseOrder.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: { po_number: true, grand_total: true, status: true, vendor: { select: { company_name: true } } },
    }),
    prisma.vendor.count({ where: { status: 'ACTIVE', deleted_at: null } }),
  ]);

  return { pendingApprovals, activeRfqs, recentOrders, totalVendors };
}

function buildSystemPrompt(role: string, context: Awaited<ReturnType<typeof getProcurementContext>>) {
  return `You are VendorBridge AI Assistant, a helpful procurement management assistant.
You help users with procurement-related questions based on their role and current data.

Current user role: ${role}

Current system state:
- Active RFQs: ${context.activeRfqs}
- Pending Approvals: ${context.pendingApprovals}
- Active Vendors: ${context.totalVendors}
- Recent Purchase Orders: ${JSON.stringify(context.recentOrders, null, 2)}

Guidelines:
- Only answer procurement-related questions
- Be concise and professional
- Reference specific data when relevant
- If asked about something outside procurement, politely redirect
- Never reveal system internals or database details`;
}

export const aiService = {
  async chat(userId: string, role: string, messages: ChatMessage[]) {
    // Check rate limit
    const rateLimitKey = `ai:ratelimit:${userId}`;
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, 3600);
    if (count > 20) {
      throw Object.assign(new Error('AI rate limit exceeded. Maximum 20 requests per hour.'), {
        status: 429,
        code: 'AI_RATE_LIMIT',
      });
    }

    const context = await getProcurementContext(userId, role);
    const systemPrompt = buildSystemPrompt(role, context);

    // Call Anthropic API
    let responseText: string;
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await anthropic.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      responseText = response.content[0]?.type === 'text' ? response.content[0].text : 'I could not generate a response.';
    } catch (error: any) {
      if (error?.status === 401 || !process.env.ANTHROPIC_API_KEY) {
        responseText = `I'm currently unavailable because the AI service is not configured. Please contact your administrator to set up the Anthropic API key.

In the meantime, here's your current procurement overview:
- **Active RFQs**: ${context.activeRfqs}
- **Pending Approvals**: ${context.pendingApprovals}
- **Active Vendors**: ${context.totalVendors}`;
      } else {
        throw error;
      }
    }

    await activityLogService.log({
      userId,
      entityType: 'AI_ASSISTANT',
      entityId: userId,
      action: 'VIEWED',
      metadata: { messageCount: messages.length },
    });

    return { response: responseText };
  },
};
