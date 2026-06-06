import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { CheckCircle, XCircle, Clock, FileText, Building2, MessageSquare } from 'lucide-react';

interface Approval {
  id: string;
  status: string;
  remarks: string | null;
  created_at: string;
  quotation?: {
    id: string;
    grand_total: number;
    delivery_days: number;
    vendor?: { company_name: string };
    rfq?: { title: string; rfq_number: string };
  };
  requester?: { name: string };
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient.get('/approvals/pending').then((r) => setApprovals(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this quotation?`)) return;
    try {
      await apiClient.patch(`/approvals/${id}/${action}`, { remarks: remarks[id] || '' });
      setApprovals((p) => p.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || `Failed to ${action}`);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="card p-6"><div className="skeleton h-6 w-64 mb-3" /><div className="skeleton h-4 w-48" /></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Pending Approvals</h2>
        <p className="text-neutral-500 text-sm">Review and approve or reject quotation requests.</p>
      </div>

      {approvals.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-success-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">All caught up!</h3>
          <p className="text-neutral-500">No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div key={approval.id} className="card p-6 animate-slide-up">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{approval.quotation?.rfq?.title || 'Quotation Approval'}</h3>
                      <p className="text-sm text-neutral-500 font-mono">{approval.quotation?.rfq?.rfq_number}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 rounded-lg p-4">
                    <div>
                      <p className="label flex items-center gap-1"><Building2 className="w-3 h-3" />Vendor</p>
                      <p className="text-sm font-medium">{approval.quotation?.vendor?.company_name || '—'}</p>
                    </div>
                    <div>
                      <p className="label">Total Amount</p>
                      <p className="text-sm font-bold text-neutral-900">₹{Number(approval.quotation?.grand_total || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="label">Delivery</p>
                      <p className="text-sm font-medium">{approval.quotation?.delivery_days || '—'} days</p>
                    </div>
                    <div>
                      <p className="label">Requested By</p>
                      <p className="text-sm font-medium">{approval.requester?.name || '—'}</p>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-neutral-400 mt-2 flex-shrink-0" />
                    <textarea
                      placeholder="Add remarks (optional)..."
                      value={remarks[approval.id] || ''}
                      onChange={(e) => setRemarks((p) => ({ ...p, [approval.id]: e.target.value }))}
                      className="input h-16 resize-none text-sm flex-1"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-3 lg:min-w-[140px]">
                  <button onClick={() => handleDecision(approval.id, 'approve')} className="btn-primary flex-1 justify-center">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleDecision(approval.id, 'reject')} className="btn-danger flex-1 justify-center">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
