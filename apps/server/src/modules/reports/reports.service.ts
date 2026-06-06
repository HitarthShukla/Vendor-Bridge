import { prisma } from '../../lib/db';
import { redis } from '../../lib/redis';

export const reportService = {
  async getDashboardStats() {
    // Check cache
    const cached = await redis.get('dashboard:stats');
    if (cached) return JSON.parse(cached);

    const [
      activeRfqs,
      pendingApprovals,
      totalVendors,
      totalPOs,
      totalInvoices,
      recentActivity,
      monthlySpend,
    ] = await Promise.all([
      prisma.rfq.count({ where: { status: 'PUBLISHED', deleted_at: null } }),
      prisma.approval.count({ where: { status: 'PENDING' } }),
      prisma.vendor.count({ where: { status: 'ACTIVE', deleted_at: null } }),
      prisma.purchaseOrder.count({ where: { deleted_at: null } }),
      prisma.invoice.count({ where: { deleted_at: null } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.purchaseOrder.aggregate({
        _sum: { grand_total: true },
        where: {
          created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          deleted_at: null,
        },
      }),
    ]);

    const stats = {
      activeRfqs,
      pendingApprovals,
      totalVendors,
      totalPOs,
      totalInvoices,
      recentActivity,
      monthlySpend: monthlySpend._sum.grand_total || 0,
    };

    // Cache for 30 seconds
    await redis.setex('dashboard:stats', 30, JSON.stringify(stats));

    return stats;
  },

  async getSpendSummary(period: 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    const cached = await redis.get(`report:spend:${period}`);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), period === 'yearly' ? 0 : period === 'quarterly' ? now.getMonth() - 3 : now.getMonth() - 12, 1);

    const orders = await prisma.purchaseOrder.findMany({
      where: { created_at: { gte: startDate }, deleted_at: null },
      select: { grand_total: true, created_at: true, vendor: { select: { category: true } } },
      orderBy: { created_at: 'asc' },
    });

    // Group by month
    const monthlyData: Record<string, number> = {};
    const categoryData: Record<string, number> = {};

    for (const order of orders) {
      const monthKey = `${order.created_at.getFullYear()}-${String(order.created_at.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(order.grand_total);

      const cat = order.vendor.category;
      categoryData[cat] = (categoryData[cat] || 0) + Number(order.grand_total);
    }

    const result = {
      totalSpend: orders.reduce((sum, o) => sum + Number(o.grand_total), 0),
      monthlyBreakdown: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
      categoryBreakdown: Object.entries(categoryData).map(([category, amount]) => ({ category, amount })),
    };

    await redis.setex(`report:spend:${period}`, 300, JSON.stringify(result));

    return result;
  },

  async getVendorPerformance() {
    const cached = await redis.get('report:vendor-performance');
    if (cached) return JSON.parse(cached);

    const vendors = await prisma.vendor.findMany({
      where: { deleted_at: null, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        company_name: true,
        rating: true,
        total_orders: true,
        category: true,
        purchase_orders: {
          select: { grand_total: true },
          where: { deleted_at: null },
        },
      },
      orderBy: { total_orders: 'desc' },
      take: 20,
    });

    const result = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      companyName: v.company_name,
      rating: v.rating,
      totalOrders: v.total_orders,
      category: v.category,
      totalSpend: v.purchase_orders.reduce((sum, po) => sum + Number(po.grand_total), 0),
    }));

    await redis.setex('report:vendor-performance', 300, JSON.stringify(result));

    return result;
  },
};
