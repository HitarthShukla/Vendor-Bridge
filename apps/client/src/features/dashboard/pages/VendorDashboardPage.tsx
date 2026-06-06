import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { FileText, ShoppingCart, DollarSign, Clock } from 'lucide-react';

export default function VendorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ activeRfqs: 0, myQuotations: 0, purchaseOrders: 0, invoicesDue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vendors see their own stats — the backend filters by the JWT vendor ID
    Promise.all([
      apiClient.get('/rfqs?status=PUBLISHED').then((r) => r.data.data?.rfqs?.length || r.data.data?.length || 0).catch(() => 0),
      apiClient.get('/quotations/rfq/all').then((r) => r.data.data?.length || 0).catch(() => 0),
      apiClient.get('/purchase-orders').then((r) => r.data.data?.purchaseOrders?.length || r.data.data?.length || 0).catch(() => 0),
      apiClient.get('/invoices?status=SENT').then((r) => r.data.data?.invoices?.length || r.data.data?.length || 0).catch(() => 0),
    ]).then(([activeRfqs, myQuotations, purchaseOrders, invoicesDue]) => {
      setStats({ activeRfqs, myQuotations, purchaseOrders, invoicesDue });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Active RFQs', value: stats.activeRfqs, icon: FileText, color: 'brand', href: '/vendor/rfqs' },
    { label: 'My Quotations', value: stats.myQuotations, icon: DollarSign, color: 'success', href: '/vendor/quotations' },
    { label: 'Purchase Orders', value: stats.purchaseOrders, icon: ShoppingCart, color: 'warning', href: '/vendor/purchase-orders' },
    { label: 'Invoices Due', value: stats.invoicesDue, icon: Clock, color: 'danger', href: '/vendor/invoices' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Welcome back, {user?.name}</h2>
        <p className="text-neutral-500 text-sm">Vendor Portal — here's an overview of your activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.href} className="card-hover p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-${card.color}-50 flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 text-${card.color}-600`} />
            </div>
            <div>
              {loading ? (
                <div className="skeleton h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
              )}
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card p-8 text-center">
        <FileText className="w-12 h-12 text-brand-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Check Active RFQs</h3>
        <p className="text-sm text-neutral-500 mb-4">Browse open procurement requests and submit your best quotations.</p>
        <Link to="/vendor/rfqs" className="btn-primary inline-flex">View Active RFQs</Link>
      </div>
    </div>
  );
}
