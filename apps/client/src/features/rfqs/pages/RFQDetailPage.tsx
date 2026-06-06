import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRfq, usePublishRfq, useCloseRfq } from '../api/rfqApi';
import { ArrowLeft, FileText, Calendar, Users, Send, Lock, ExternalLink } from 'lucide-react';

export default function RFQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading } = useRfq(id!);
  const publishMutation = usePublishRfq(id!);
  const closeMutation = useCloseRfq(id!);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto space-y-6"><div className="skeleton h-8 w-48" /><div className="card p-6 space-y-4"><div className="skeleton h-6 w-64" /><div className="skeleton h-4 w-48" /></div></div>;
  }

  if (!rfq) {
    return <div className="card p-8 text-center text-danger-600 bg-danger-50 max-w-lg mx-auto mt-12">RFQ not found.<Link to="/rfqs" className="btn-secondary mt-4 mx-auto">Back to RFQs</Link></div>;
  }

  const handlePublish = async () => {
    if (!confirm('Publish this RFQ? Vendors will be notified.')) return;
    try { await publishMutation.mutateAsync(); } catch { alert('Failed to publish'); }
  };

  const handleClose = async () => {
    if (!confirm('Close this RFQ? No more quotations can be submitted.')) return;
    try { await closeMutation.mutateAsync(); } catch { alert('Failed to close'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/rfqs" className="btn-ghost p-2 -ml-2 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-neutral-900">{rfq.rfq_number}</h2>
            <span className={`badge ${rfq.status === 'PUBLISHED' ? 'badge-active' : rfq.status === 'CLOSED' ? 'badge-danger' : 'badge-draft'}`}>{rfq.status}</span>
          </div>
          <p className="text-neutral-500 text-sm">{rfq.title}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'DRAFT' && <button onClick={handlePublish} className="btn-primary" disabled={publishMutation.isPending}><Send className="w-4 h-4" />{publishMutation.isPending ? 'Publishing...' : 'Publish'}</button>}
          {rfq.status === 'PUBLISHED' && <button onClick={handleClose} className="btn-danger" disabled={closeMutation.isPending}><Lock className="w-4 h-4" />{closeMutation.isPending ? 'Closing...' : 'Close RFQ'}</button>}
          {rfq.status !== 'DRAFT' && <Link to={`/quotations/compare/${rfq.id}`} className="btn-secondary"><ExternalLink className="w-4 h-4" />Compare Quotes</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" />Description</h3>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{rfq.description || 'No description provided.'}</p>
          </div>

          {/* Line Items */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Line Items ({(rfq as any).items?.length || 0})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-neutral-200 text-left">
                  <th className="py-3 pr-4 font-medium text-neutral-500">#</th>
                  <th className="py-3 pr-4 font-medium text-neutral-500">Description</th>
                  <th className="py-3 pr-4 font-medium text-neutral-500">Qty</th>
                  <th className="py-3 font-medium text-neutral-500">Unit</th>
                </tr></thead>
                <tbody>
                  {(rfq as any).items?.map((item: any, i: number) => (
                    <tr key={item.id} className="border-b border-neutral-100">
                      <td className="py-3 pr-4 text-neutral-400">{i + 1}</td>
                      <td className="py-3 pr-4 font-medium">{item.description}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-500 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" />Timeline</h3>
            <div className="space-y-3 text-sm">
              <div><p className="text-neutral-400">Created</p><p className="font-medium">{new Date(rfq.created_at).toLocaleDateString()}</p></div>
              <div><p className="text-neutral-400">Deadline</p><p className="font-medium text-danger-600">{new Date(rfq.submission_deadline).toLocaleDateString()}</p></div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-500 mb-4 flex items-center gap-2"><Users className="w-4 h-4" />Assigned Vendors</h3>
            <div className="space-y-2">
              {(rfq as any).vendors?.length ? (rfq as any).vendors.map((v: any) => (
                <div key={v.id} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                  <div className="w-7 h-7 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{v.vendor?.company_name?.charAt(0)}</div>
                  <span className="text-sm font-medium truncate">{v.vendor?.company_name}</span>
                </div>
              )) : <p className="text-sm text-neutral-500">No vendors assigned</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
