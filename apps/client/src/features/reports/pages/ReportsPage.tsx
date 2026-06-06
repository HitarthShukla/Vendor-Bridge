import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { BarChart3, TrendingUp, Users, DollarSign, PieChart } from 'lucide-react';

interface SpendSummary {
  monthly: { month: string; total: number }[];
  quarterly: { quarter: string; total: number }[];
  categoryBreakdown: { category: string; total: number }[];
}

interface VendorPerf {
  vendor_id: string;
  company_name: string;
  total_orders: number;
  total_spend: number;
  avg_delivery_days: number;
}

export default function ReportsPage() {
  const [spend, setSpend] = useState<SpendSummary | null>(null);
  const [vendorPerf, setVendorPerf] = useState<VendorPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/reports/spend-summary').then((r) => setSpend(r.data.data)).catch(() => {}),
      apiClient.get('/reports/vendor-performance').then((r) => setVendorPerf(r.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const maxSpend = Math.max(...(spend?.monthly?.map((m) => m.total) || [1]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h2>
        <p className="text-neutral-500 text-sm">Insights into procurement performance and spend analysis.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card p-6"><div className="skeleton h-6 w-48 mb-4" /><div className="skeleton h-40 w-full" /></div>)}
        </div>
      ) : (
        <>
          {/* Monthly Spend Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand-500" />Monthly Spend Trend</h3>
            {spend?.monthly?.length ? (
              <div className="flex items-end gap-2 h-48">
                {spend.monthly.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-neutral-900">₹{(m.total / 1000).toFixed(0)}k</span>
                    <div
                      className="w-full bg-brand-500 rounded-t-md transition-all duration-500 min-h-[4px]"
                      style={{ height: `${Math.max(4, (m.total / maxSpend) * 160)}px` }}
                    />
                    <span className="text-[10px] text-neutral-500 font-medium">{m.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No spend data available yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-brand-500" />Spend by Category</h3>
              {spend?.categoryBreakdown?.length ? (
                <div className="space-y-3">
                  {spend.categoryBreakdown.map((cat) => {
                    const total = spend.categoryBreakdown.reduce((s, c) => s + c.total, 0);
                    const pct = total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-neutral-700">{cat.category}</span>
                          <span className="text-neutral-500">₹{Number(cat.total).toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No category data available.</p>
              )}
            </div>

            {/* Vendor Performance */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-500" />Vendor Performance</h3>
              {vendorPerf.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-200 text-left">
                      <th className="py-2 pr-4 font-medium text-neutral-500">Vendor</th>
                      <th className="py-2 pr-4 font-medium text-neutral-500">Orders</th>
                      <th className="py-2 pr-4 font-medium text-neutral-500">Spend</th>
                      <th className="py-2 font-medium text-neutral-500">Avg Delivery</th>
                    </tr></thead>
                    <tbody>
                      {vendorPerf.map((v) => (
                        <tr key={v.vendor_id} className="border-b border-neutral-100">
                          <td className="py-2 pr-4 font-medium">{v.company_name}</td>
                          <td className="py-2 pr-4">{v.total_orders}</td>
                          <td className="py-2 pr-4 font-mono">₹{Number(v.total_spend).toLocaleString()}</td>
                          <td className="py-2">{v.avg_delivery_days} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No vendor performance data yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
