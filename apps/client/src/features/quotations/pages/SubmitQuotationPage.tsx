import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRfq } from '@/features/rfqs/api/rfqApi';
import { useCreateAndSubmitQuotation } from '../api/quotationApi';
import { ArrowLeft, FileText, Calendar, IndianRupee, Send, ShieldCheck } from 'lucide-react';

export default function SubmitQuotationPage() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading } = useRfq(rfqId!);
  const createAndSubmitMutation = useCreateAndSubmitQuotation();

  // Form states
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [currency, setCurrency] = useState<string>('INR');
  const [notes, setNotes] = useState<string>('');
  
  // Line items state (key is rfqItemId)
  const [itemPrices, setItemPrices] = useState<Record<string, { unitPrice: number; taxPercent: number; notes: string }>>({});

  // Initialize item prices when RFQ loads
  useEffect(() => {
    if (rfq && (rfq as any).items) {
      const initial: Record<string, { unitPrice: number; taxPercent: number; notes: string }> = {};
      (rfq as any).items.forEach((item: any) => {
        initial[item.id] = {
          unitPrice: 0,
          taxPercent: 18,
          notes: '',
        };
      });
      setItemPrices(initial);
    }
  }, [rfq]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-6 w-64" />
          <div className="skeleton h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="card p-8 text-center text-danger-600 bg-danger-50 max-w-lg mx-auto mt-12">
        RFQ not found.
        <Link to="/vendor/rfqs" className="btn-secondary mt-4 mx-auto">Back to RFQs</Link>
      </div>
    );
  }

  // Handle item input updates
  const handleItemChange = (itemId: string, field: 'unitPrice' | 'taxPercent' | 'notes', value: any) => {
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId]!,
        [field]: value,
      },
    }));
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    if (rfq && (rfq as any).items) {
      (rfq as any).items.forEach((item: any) => {
        const pricing = itemPrices[item.id];
        if (pricing) {
          const qty = Number(item.quantity);
          const price = pricing.unitPrice;
          const tax = pricing.taxPercent;

          const itemSubtotal = price * qty;
          const itemTax = itemSubtotal * (tax / 100);

          subtotal += itemSubtotal;
          taxTotal += itemTax;
        }
      });
    }

    return {
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal,
    };
  };

  const { subtotal, taxTotal, grandTotal } = calculateTotals();

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!deliveryDays || deliveryDays <= 0) {
      alert('Please enter a valid positive delivery timeline (days).');
      return;
    }
    if (!validityDays || validityDays <= 0) {
      alert('Please enter a valid positive quote validity period (days).');
      return;
    }

    const itemsPayload: any[] = [];
    let hasInvalidPrice = false;

    (rfq as any).items.forEach((item: any) => {
      const pricing = itemPrices[item.id];
      if (!pricing || pricing.unitPrice <= 0) {
        hasInvalidPrice = true;
      } else {
        itemsPayload.push({
          rfqItemId: item.id,
          unitPrice: Number(pricing.unitPrice),
          quantity: Number(item.quantity),
          taxPercent: Number(pricing.taxPercent),
          notes: pricing.notes || undefined,
        });
      }
    });

    if (hasInvalidPrice) {
      alert('Please enter positive unit prices for all items.');
      return;
    }

    const payload = {
      rfqId: rfq.id,
      deliveryDays: Number(deliveryDays),
      validityDays: Number(validityDays),
      currency,
      notes: notes || undefined,
      items: itemsPayload,
    };

    try {
      await createAndSubmitMutation.mutateAsync(payload);
      alert('Quotation submitted successfully!');
      navigate('/vendor/quotations');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Failed to submit quotation.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/vendor/rfqs/${rfq.id}`} className="btn-ghost p-2 -ml-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Submit Bid</h2>
          <p className="text-neutral-500 text-sm">Quoting for {rfq.rfq_number} — {rfq.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: input details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline & Validity settings */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" /> Quotation Terms
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Delivery Timeline (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g. 7"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Bid Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="e.g. 30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Notes or Terms & Conditions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[100px] py-2"
                placeholder="Optional notes or exclusions..."
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" /> Line Items Pricing
            </h3>
            <div className="space-y-6">
              {(rfq as any).items?.map((item: any, idx: number) => {
                const pricing = itemPrices[item.id] || { unitPrice: 0, taxPercent: 18, notes: '' };
                return (
                  <div key={item.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-neutral-400 font-mono">Item #{idx + 1}</span>
                        <h4 className="font-semibold text-neutral-900">{item.description || item.name}</h4>
                        <p className="text-xs text-neutral-500">Required Quantity: {item.quantity} {item.unit}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Unit Price (INR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">₹</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={pricing.unitPrice || ''}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="input pl-7"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">GST (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={pricing.taxPercent}
                          onChange={(e) => handleItemChange(item.id, 'taxPercent', parseInt(e.target.value) || 0)}
                          className="input"
                          placeholder="18"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Item Total (incl. GST)</label>
                        <div className="input bg-neutral-100 font-bold flex items-center select-none text-neutral-700">
                          ₹{((pricing.unitPrice * Number(item.quantity)) * (1 + pricing.taxPercent / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: summary of costs */}
        <div className="space-y-6">
          <div className="card p-6 bg-brand-900 text-white space-y-6 sticky top-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-brand-800 pb-3">
              <IndianRupee className="w-5 h-5" /> Summary of Costs
            </h3>
            <div className="space-y-3 text-sm text-brand-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-white">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Total (GST)</span>
                <span className="font-semibold text-white">₹{taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white border-t border-brand-800 pt-3">
                <span>Grand Total</span>
                <span className="text-xl">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex gap-2 text-xs text-brand-300 bg-brand-950/40 p-3 rounded-lg border border-brand-800">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-brand-400" />
              <p>This is a formal and legally binding bid. Bids cannot be modified once submitted.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-white hover:bg-neutral-100 text-brand-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150"
              disabled={createAndSubmitMutation.isPending}
            >
              {createAndSubmitMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Quotation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
