import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { FileText, Send, Clock, CheckCircle } from 'lucide-react';

interface VendorQuotation {
  id: string;
  quotation_number: string;
  status: string;
  total_amount: number;
  delivery_days: number;
  created_at: string;
  rfq?: { rfq_number: string; title: string };
}

export default function VendorSubmitQuotationPage() {
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/quotations/rfq/all')
      .then((r) => setQuotations(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'badge-draft',
      SUBMITTED: 'badge-sent',
      UNDER_REVIEW: 'badge-pending',
      SELECTED: 'badge-approved',
      REJECTED: 'badge-rejected',
    };
    return map[s] || 'badge-draft';
  };

  const statusIcon = (s: string) => {
    if (s === 'SUBMITTED') return <Send className="w-5 h-5 text-brand-600" />;
    if (s === 'SELECTED') return <CheckCircle className="w-5 h-5 text-success-600" />;
    if (s === 'UNDER_REVIEW') return <Clock className="w-5 h-5 text-warning-600" />;
    return <FileText className="w-5 h-5 text-neutral-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">My Quotations</h2>
        <p className="text-neutral-500 text-sm">Track the status of all your submitted bids.</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="card p-6"><div className="skeleton h-6 w-64 mb-2" /><div className="skeleton h-4 w-48" /></div>)}</div>
      ) : quotations.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No quotations yet</h3>
          <p className="text-neutral-500">Browse Active RFQs and submit your bids to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((q) => (
            <div key={q.id} className="card-hover p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 md:w-1/3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  {statusIcon(q.status)}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 font-mono">{q.quotation_number}</h3>
                  <span className={`badge mt-1 ${statusBadge(q.status)}`}>{q.status}</span>
                </div>
              </div>
              <div className="flex-1 text-sm text-neutral-600">
                <p className="font-medium text-neutral-900">{q.rfq?.title || 'RFQ'}</p>
                <p className="text-neutral-500 font-mono text-xs">{q.rfq?.rfq_number}</p>
              </div>
              <div className="text-right md:w-1/5">
                <p className="text-lg font-bold text-neutral-900">₹{Number(q.total_amount).toLocaleString()}</p>
                <p className="text-xs text-neutral-500">{q.delivery_days} days delivery</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
