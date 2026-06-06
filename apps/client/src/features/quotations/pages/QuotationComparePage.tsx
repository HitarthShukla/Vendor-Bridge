import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuotationsByRfq, useApproveQuotation } from '../api/quotationApi';
import { useRfq } from '@/features/rfqs/api/rfqApi';
import { CheckCircle, AlertCircle, ArrowLeft, Building2, Truck, DollarSign } from 'lucide-react';

export default function QuotationComparePage() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading: rfqLoading } = useRfq(rfqId!);
  const { data: quotations, isLoading: quotesLoading } = useQuotationsByRfq(rfqId!);
  const approveMutation = useApproveQuotation();
  
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  if (rfqLoading || quotesLoading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (!rfq || !quotations || quotations.length === 0) {
    return (
      <div className="card p-12 text-center max-w-2xl mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">No quotations received yet</h2>
        <p className="text-neutral-500 mb-6">Vendors have not submitted any bids for this RFQ.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  // Find lowest overall price
  const lowestTotal = Math.min(...quotations.map(q => Number(q.grand_total)));

  const handleApprove = async (quoteId: string) => {
    if (!confirm('Are you sure you want to approve this quotation and generate a Purchase Order?')) return;
    try {
      await approveMutation.mutateAsync({ id: quoteId, remarks: 'Approved from comparison view' });
      navigate('/purchase-orders');
    } catch (error) {
      console.error(error);
      alert('Failed to approve quotation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Compare Quotations</h2>
          <p className="text-neutral-500 text-sm">Evaluating {quotations.length} bids for {rfq.title}</p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {quotations.map((quote) => {
          const isLowest = Number(quote.grand_total) === lowestTotal;
          const isSelected = selectedQuoteId === quote.id;

          return (
            <div 
              key={quote.id} 
              className={`card transition-all duration-200 ${isSelected ? 'ring-2 ring-brand-500 shadow-md' : 'hover:shadow-md'} ${isLowest ? 'border-success-200 bg-success-50/10' : ''}`}
            >
              {isLowest && (
                <div className="bg-success-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-xl">
                  Lowest Bid
                </div>
              )}
              
              <div className="p-6">
                {/* Vendor Info */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900">{(quote as any).vendor?.company_name || 'Vendor'}</h3>
                    <p className="text-sm text-neutral-500">Submitted {new Date(quote.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">Grand Total</span>
                    </div>
                    <span className={`text-lg font-bold ${isLowest ? 'text-success-700' : 'text-neutral-900'}`}>
                      ₹{Number(quote.grand_total).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-medium">Delivery Timeline</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-900">{quote.delivery_days} days</span>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Line Items</h4>
                  <div className="space-y-3">
                    {(quote as any).items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-neutral-600 truncate pr-4" title={item.rfq_item?.description}>
                          {item.rfq_item?.description || 'Item'} (x{item.rfq_item?.quantity})
                        </span>
                        <span className="font-medium text-neutral-900">₹{Number(item.unit_price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-neutral-100">
                  <button 
                    onClick={() => handleApprove(quote.id)}
                    className="w-full btn-primary justify-center"
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending && selectedQuoteId === quote.id ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve & Generate PO
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
