import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { FileText, Building2, Calendar, DollarSign, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  grand_total: number;
  due_date: string;
  created_at: string;
  vendor?: { company_name: string };
  purchase_order?: { po_number: string };
  blockchain_tx?: string;
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/invoices').then((r) => setInvoices(r.data.data?.invoices || r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { DRAFT: 'badge-draft', SENT: 'badge-sent', PAID: 'badge-paid', OVERDUE: 'badge-overdue', CANCELLED: 'badge-rejected' };
    return map[s] || 'badge-draft';
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'PAID' && status !== 'CANCELLED' && new Date(dueDate) < new Date();
  };

  const handleSendEmail = async (id: string) => {
    if (!confirm('Send this invoice via email to the vendor?')) return;
    try {
      await apiClient.post(`/invoices/${id}/send-email`);
      alert('Invoice sent successfully!');
    } catch { alert('Failed to send invoice.'); }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm('Mark this invoice as paid?')) return;
    try {
      await apiClient.patch(`/invoices/${id}/mark-paid`);
      setInvoices((p) => p.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' } : inv)));
    } catch { alert('Failed to update invoice.'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Invoices</h2>
        <p className="text-neutral-500 text-sm">Manage, send, and track all invoices.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="card p-6"><div className="skeleton h-6 w-40 mb-2" /><div className="skeleton h-4 w-24" /></div>)}</div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No invoices yet</h3>
          <p className="text-neutral-500">Invoices are generated from confirmed purchase orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <div key={inv.id} className={`card p-6 flex flex-col md:flex-row md:items-center gap-6 ${isOverdue(inv.due_date, inv.status) ? 'border-danger-200 bg-danger-50/30' : ''}`}>
              <div className="flex items-center gap-4 md:w-1/4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${inv.status === 'PAID' ? 'bg-success-50' : isOverdue(inv.due_date, inv.status) ? 'bg-danger-50' : 'bg-neutral-100'}`}>
                  {inv.status === 'PAID' ? <CheckCircle className="w-6 h-6 text-success-600" /> :
                   isOverdue(inv.due_date, inv.status) ? <AlertCircle className="w-6 h-6 text-danger-600" /> :
                   <FileText className="w-6 h-6 text-neutral-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 font-mono">{inv.invoice_number}</h3>
                  <span className={`badge mt-1 ${isOverdue(inv.due_date, inv.status) ? 'badge-overdue' : statusBadge(inv.status)}`}>
                    {isOverdue(inv.due_date, inv.status) ? 'OVERDUE' : inv.status}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-6 text-sm text-neutral-600">
                <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-neutral-400" />{inv.vendor?.company_name || '—'}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-neutral-400" />Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                {inv.purchase_order && <div className="flex items-center gap-1.5 font-mono text-xs"><Clock className="w-4 h-4 text-neutral-400" />{inv.purchase_order.po_number}</div>}
              </div>

              <div className="text-right md:w-1/5">
                <p className="text-xl font-bold text-neutral-900">₹{Number(inv.grand_total).toLocaleString()}</p>
              </div>

              <div className="flex gap-2 md:w-auto flex-shrink-0">
                {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                  <>
                    <button onClick={() => handleSendEmail(inv.id)} className="btn-secondary text-xs py-1.5 px-3"><Send className="w-3 h-3" />Email</button>
                    <button onClick={() => handleMarkPaid(inv.id)} className="btn-primary text-xs py-1.5 px-3"><CheckCircle className="w-3 h-3" />Paid</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
