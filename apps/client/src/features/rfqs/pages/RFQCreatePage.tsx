import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateRfq } from '../api/rfqApi';
import { useVendors } from '@/features/vendors/api/vendorApi';
import { ArrowLeft, Plus, Trash2, Save, FileText } from 'lucide-react';

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
}

export default function RFQCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateRfq();
  const { data: vendorData } = useVendors('?status=ACTIVE');

  const [form, setForm] = useState({
    title: '',
    description: '',
    submission_deadline: '',
    vendor_ids: [] as string[],
  });

  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit: 'Units', specifications: '' },
  ]);

  const addItem = () => setItems((p) => [...p, { description: '', quantity: 1, unit: 'Units', specifications: '' }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  const toggleVendor = (id: string) => {
    setForm((p) => ({
      ...p,
      vendor_ids: p.vendor_ids.includes(id) ? p.vendor_ids.filter((v) => v !== id) : [...p.vendor_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...form,
        items,
      } as any);
      navigate('/rfqs');
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create RFQ');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/rfqs" className="btn-ghost p-2 -ml-2 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Create New RFQ</h2>
          <p className="text-neutral-500 text-sm">Specify your procurement requirements and invite vendors.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-brand-500" />RFQ Details</h3>
          <div><label className="label">Title *</label><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input mt-1" required placeholder="e.g. Office Laptop Procurement Q3 2026" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input mt-1 h-24 resize-none" placeholder="Describe your requirements in detail..." /></div>
          <div><label className="label">Submission Deadline *</label><input type="datetime-local" value={form.submission_deadline} onChange={(e) => setForm((p) => ({ ...p, submission_deadline: e.target.value }))} className="input mt-1 max-w-xs" required /></div>
        </div>

        {/* Line Items */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Line Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-sm"><Plus className="w-4 h-4" />Add Item</button>
          </div>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-500">Item #{i + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-danger-500 hover:text-danger-700 p-1"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2"><label className="label">Description *</label><input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className="input mt-1" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Qty *</label><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', +e.target.value)} className="input mt-1" required /></div>
                    <div><label className="label">Unit</label><input value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} className="input mt-1" /></div>
                  </div>
                </div>
                <div><label className="label">Specifications</label><input value={item.specifications} onChange={(e) => updateItem(i, 'specifications', e.target.value)} className="input mt-1" placeholder="Technical specs, brand preferences, etc." /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Assignment */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Invite Vendors</h3>
          {vendorData?.vendors?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vendorData.vendors.map((v) => (
                <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.vendor_ids.includes(v.id) ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                  <input type="checkbox" checked={form.vendor_ids.includes(v.id)} onChange={() => toggleVendor(v.id)} className="w-4 h-4 text-brand-600 rounded" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{v.company_name}</p>
                    <p className="text-xs text-neutral-500">{v.contact_email}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No active vendors found. <Link to="/vendors/new" className="text-brand-600 underline">Register a vendor first.</Link></p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/rfqs" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create RFQ'}
          </button>
        </div>
      </form>
    </div>
  );
}
