import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import {
  BarChart3,
  FileText,
  ShoppingCart,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

interface DashboardStats {
  activeRfqs: number;
  pendingApprovals: number;
  totalVendors: number;
  totalPOs: number;
  totalInvoices: number;
  monthlySpend: number;
  recentActivity: Array<{
    id: string;
    entity_type: string;
    action: string;
    created_at: string;
    user?: { name: string };
  }>;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/reports/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Active RFQs', value: stats?.activeRfqs ?? 0, icon: FileText, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: Clock, color: 'text-warning-700', bg: 'bg-warning-50' },
    { label: 'Active Vendors', value: stats?.totalVendors ?? 0, icon: Users, color: 'text-success-700', bg: 'bg-success-50' },
    { label: 'Purchase Orders', value: stats?.totalPOs ?? 0, icon: ShoppingCart, color: 'text-brand-700', bg: 'bg-brand-50' },
    { label: 'Invoices', value: stats?.totalInvoices ?? 0, icon: BarChart3, color: 'text-neutral-700', bg: 'bg-neutral-100' },
    { label: 'Monthly Spend', value: `₹${((stats?.monthlySpend ?? 0) / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'text-success-700', bg: 'bg-success-50' },
  ];

  return (
    <>
      {/* Role badge */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p className="text-neutral-500">Here is what's happening with your procurement operations today.</p>
        </div>
        <span className="badge badge-active">{user?.role?.replace('_', ' ')}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) =>
          loading ? (
            <div key={card.label} className="card p-4">
              <div className="skeleton h-4 w-20 mb-3" />
              <div className="skeleton h-8 w-12" />
            </div>
          ) : (
            <div key={card.label} className="card-hover p-4 animate-slide-up" id={`stat-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
              <p className="text-xs text-neutral-500 mt-1">{card.label}</p>
            </div>
          )
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-neutral-400" />
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-48 mb-2" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
            ))
          ) : stats?.recentActivity?.length ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.action === 'APPROVED' ? 'bg-success-50' :
                  activity.action === 'REJECTED' ? 'bg-danger-50' :
                  activity.action === 'CREATED' ? 'bg-brand-50' : 'bg-neutral-100'
                }`}>
                  {activity.action === 'APPROVED' ? <CheckCircle className="w-4 h-4 text-success-700" /> :
                    activity.action === 'REJECTED' ? <AlertCircle className="w-4 h-4 text-danger-700" /> :
                    <ChevronRight className="w-4 h-4 text-neutral-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium">{activity.user?.name || 'System'}</span>
                    {' '}{activity.action.toLowerCase()} a {activity.entity_type.toLowerCase().replace('_', ' ')}
                  </p>
                  <p className="text-xs text-neutral-400">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No recent activity yet</p>
              <p className="text-sm text-neutral-400 mt-1">Start by creating an RFQ or registering a vendor</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
