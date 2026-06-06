import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateVendor } from '../api/vendorApi';
import { Building2, ArrowLeft, Save } from 'lucide-react';

export default function VendorCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateVendor();
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    gst_number: '',
    pan_number: '',
    categories: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
    bank_details: { bank_name: '', account_number: '', ifsc_code: '', branch: '' },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm((p) => ({ ...p, address: { ...p.address, [field]: value } }));
    } else if (name.startsWith('bank.')) {
      const field = name.split('.')[1];
      setForm((p) => ({ ...p, bank_details: { ...p.bank_details, [field]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...form,
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
      } as any);
      navigate('/vendors');
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create vendor');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/vendors" className="btn-ghost p-2 -ml-2 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Register New Vendor</h2>
          <p className="text-neutral-500 text-sm">Add a new supplier to your vendor directory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-brand-500" /> Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Company Name *</label><input name="company_name" value={form.company_name} onChange={handleChange} className="input mt-1" required /></div>
            <div><label className="label">Contact Person *</label><input name="contact_name" value={form.contact_name} onChange={handleChange} className="input mt-1" required /></div>
            <div><label className="label">Email *</label><input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} className="input mt-1" required /></div>
            <div><label className="label">Phone</label><input name="contact_phone" value={form.contact_phone} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">GST Number</label><input name="gst_number" value={form.gst_number} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">PAN Number</label><input name="pan_number" value={form.pan_number} onChange={handleChange} className="input mt-1" /></div>
            <div className="md:col-span-2"><label className="label">Categories (comma-separated)</label><input name="categories" value={form.categories} onChange={handleChange} className="input mt-1" placeholder="Electronics, IT Hardware, Office Supplies" /></div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Address Line 1</label><input name="address.line1" value={form.address.line1} onChange={handleChange} className="input mt-1" /></div>
            <div className="md:col-span-2"><label className="label">Address Line 2</label><input name="address.line2" value={form.address.line2} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">City</label><input name="address.city" value={form.address.city} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">State</label><input name="address.state" value={form.address.state} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">Pincode</label><input name="address.pincode" value={form.address.pincode} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">Country</label><input name="address.country" value={form.address.country} onChange={handleChange} className="input mt-1" /></div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Bank Name</label><input name="bank.bank_name" value={form.bank_details.bank_name} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">Account Number</label><input name="bank.account_number" value={form.bank_details.account_number} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">IFSC Code</label><input name="bank.ifsc_code" value={form.bank_details.ifsc_code} onChange={handleChange} className="input mt-1" /></div>
            <div><label className="label">Branch</label><input name="bank.branch" value={form.bank_details.branch} onChange={handleChange} className="input mt-1" /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/vendors" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Register Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
