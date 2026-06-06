import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Link } from 'react-router-dom';
import { ShoppingCart, Building2, Calendar, Hash, CheckCircle2, Truck } from 'lucide-react';

interface PO {
  id: string;
  po_number: string;
  status: string;
  grand_total: number;
  created_at: string;
  vendor?: { company_name: string };
  blockchain_tx?: string;
}

export default function PurchaseOrderListPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/purchase-orders').then((r) => setOrders(r.data.data?.purchaseOrders || r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { DRAFT: 'badge-draft', CONFIRMED: 'badge-active', DELIVERED: 'badge-approved', CANCELLED: 'badge-rejected' };
    return map[s] || 'badge-draft';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Purchase Orders</h2>
        <p className="text-neutral-500 text-sm">Track and manage generated purchase orders.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="card p-6 flex gap-4"><div className="skeleton w-12 h-12 rounded-lg" /><div className="flex-1"><div className="skeleton h-5 w-40 mb-2" /><div className="skeleton h-4 w-24" /></div></div>)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <ShoppingCart className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No purchase orders yet</h3>
          <p className="text-neutral-500">Purchase orders are auto-generated when quotations are approved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((po) => (
            <div key={po.id} className="card-hover p-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 md:w-1/4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-brand-600" /></div>
                <div>
                  <h3 className="font-bold text-neutral-900 font-mono">{po.po_number}</h3>
                  <span className={`badge mt-1 ${statusBadge(po.status)}`}>{po.status}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-6 text-sm text-neutral-600">
                <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-neutral-400" />{po.vendor?.company_name || '—'}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-neutral-400" />{new Date(po.created_at).toLocaleDateString()}</div>
                {po.blockchain_tx && <div className="flex items-center gap-1.5 text-success-700"><CheckCircle2 className="w-4 h-4" />Blockchain Verified</div>}
              </div>
              <div className="text-right md:w-1/5">
                <p className="text-xl font-bold text-neutral-900">₹{Number(po.grand_total).toLocaleString()}</p>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Grand Total</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
