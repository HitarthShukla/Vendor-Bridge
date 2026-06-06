import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateVendor } from '../api/vendorApi';
import { Building2, ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function VendorCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateVendor();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    gstNumber: '',
    panNumber: '',
    category: '',
    notes: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    bankDetails: { bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFieldErrors((p) => ({ ...p, [name]: '' }));
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm((p) => ({ ...p, address: { ...p.address, [field]: value } }));
    } else if (name.startsWith('bank.')) {
      const field = name.split('.')[1];
      setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, [field]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.companyName.trim()) errors.companyName = 'Company name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) errors.phone = 'Enter a valid 10-digit Indian phone number';
    if (!form.gstNumber.trim()) errors.gstNumber = 'GST number is required';
    if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber)) errors.gstNumber = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)';
    if (!form.category.trim()) errors.category = 'Category is required';
    if (!form.address.street.trim()) errors['address.street'] = 'Street is required';
    if (!form.address.city.trim()) errors['address.city'] = 'City is required';
    if (!form.address.state.trim()) errors['address.state'] = 'State is required';
    if (!form.address.pincode.trim()) errors['address.pincode'] = 'Pincode is required';
    if (form.address.pincode && !/^\d{6}$/.test(form.address.pincode)) errors['address.pincode'] = 'Enter a valid 6-digit pincode';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      // Build payload matching the Zod schema exactly
      const payload: any = {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(),
        category: form.category.trim(),
        address: {
          street: form.address.street.trim(),
          city: form.address.city.trim(),
          state: form.address.state.trim(),
          pincode: form.address.pincode.trim(),
          country: form.address.country || 'India',
        },
      };

      if (form.panNumber.trim()) {
        payload.panNumber = form.panNumber.trim().toUpperCase();
      }
      if (form.notes.trim()) {
        payload.notes = form.notes.trim();
      }
      // Only include bank details if at least one field is filled
      if (form.bankDetails.bankName || form.bankDetails.accountNumber) {
        payload.bankDetails = {
          bankName: form.bankDetails.bankName.trim(),
          accountNumber: form.bankDetails.accountNumber.trim(),
          ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
          accountHolderName: form.bankDetails.accountHolderName.trim(),
        };
      }

      await createMutation.mutateAsync(payload);
      navigate('/vendors');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message;
      if (typeof msg === 'object' && msg?.fieldErrors) {
        // Zod validation error response
        const zErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(msg.fieldErrors as Record<string, string[]>)) {
          zErrors[key] = (messages as string[])[0];
        }
        setFieldErrors(zErrors);
        setError('Please fix the highlighted fields.');
      } else {
        setError(typeof msg === 'string' ? msg : 'Failed to create vendor. Please check your inputs.');
      }
    }
  };

  const FieldError = ({ name }: { name: string }) => {
    const msg = fieldErrors[name];
    return msg ? <p className="text-xs text-danger-600 mt-1">{msg}</p> : null;
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

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-brand-500" /> Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Person Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className={`input mt-1 ${fieldErrors.name ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="John Doe" />
              <FieldError name="name" />
            </div>
            <div>
              <label className="label">Company Name *</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className={`input mt-1 ${fieldErrors.companyName ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="Acme Industries Pvt Ltd" />
              <FieldError name="companyName" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className={`input mt-1 ${fieldErrors.email ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="vendor@company.com" />
              <FieldError name="email" />
            </div>
            <div>
              <label className="label">Phone (10 digits) *</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={`input mt-1 ${fieldErrors.phone ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="9876543210" maxLength={10} />
              <FieldError name="phone" />
            </div>
            <div>
              <label className="label">GST Number *</label>
              <input name="gstNumber" value={form.gstNumber} onChange={handleChange} className={`input mt-1 uppercase ${fieldErrors.gstNumber ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="22AAAAA0000A1Z5" maxLength={15} />
              <FieldError name="gstNumber" />
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input name="panNumber" value={form.panNumber} onChange={handleChange} className={`input mt-1 uppercase ${fieldErrors.panNumber ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="ABCDE1234F" maxLength={10} />
              <FieldError name="panNumber" />
            </div>
            <div>
              <label className="label">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className={`input mt-1 ${fieldErrors.category ? 'border-danger-500 ring-1 ring-danger-500' : ''}`}>
                <option value="">Select category...</option>
                <option value="IT Hardware">IT Hardware</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Industrial Equipment">Industrial Equipment</option>
                <option value="Software & Licenses">Software & Licenses</option>
                <option value="Logistics & Transport">Logistics & Transport</option>
                <option value="Maintenance & Repair">Maintenance & Repair</option>
                <option value="Other">Other</option>
              </select>
              <FieldError name="category" />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input mt-1 h-10 resize-none" placeholder="Optional notes..." maxLength={500} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Address *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Street Address *</label>
              <input name="address.street" value={form.address.street} onChange={handleChange} className={`input mt-1 ${fieldErrors['address.street'] ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="123 MG Road" />
              <FieldError name="address.street" />
            </div>
            <div>
              <label className="label">City *</label>
              <input name="address.city" value={form.address.city} onChange={handleChange} className={`input mt-1 ${fieldErrors['address.city'] ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="Mumbai" />
              <FieldError name="address.city" />
            </div>
            <div>
              <label className="label">State *</label>
              <input name="address.state" value={form.address.state} onChange={handleChange} className={`input mt-1 ${fieldErrors['address.state'] ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="Maharashtra" />
              <FieldError name="address.state" />
            </div>
            <div>
              <label className="label">Pincode *</label>
              <input name="address.pincode" value={form.address.pincode} onChange={handleChange} className={`input mt-1 ${fieldErrors['address.pincode'] ? 'border-danger-500 ring-1 ring-danger-500' : ''}`} placeholder="400001" maxLength={6} />
              <FieldError name="address.pincode" />
            </div>
            <div>
              <label className="label">Country</label>
              <input name="address.country" value={form.address.country} onChange={handleChange} className="input mt-1" />
            </div>
          </div>
        </div>

        {/* Bank Details (Optional) */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Bank Details <span className="text-sm font-normal text-neutral-400">(Optional)</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Bank Name</label>
              <input name="bank.bankName" value={form.bankDetails.bankName} onChange={handleChange} className="input mt-1" placeholder="State Bank of India" />
            </div>
            <div>
              <label className="label">Account Number</label>
              <input name="bank.accountNumber" value={form.bankDetails.accountNumber} onChange={handleChange} className="input mt-1" placeholder="1234567890123" />
            </div>
            <div>
              <label className="label">IFSC Code</label>
              <input name="bank.ifscCode" value={form.bankDetails.ifscCode} onChange={handleChange} className="input mt-1 uppercase" placeholder="SBIN0001234" maxLength={11} />
            </div>
            <div>
              <label className="label">Account Holder Name</label>
              <input name="bank.accountHolderName" value={form.bankDetails.accountHolderName} onChange={handleChange} className="input mt-1" placeholder="Acme Industries Pvt Ltd" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/vendors" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Registering...' : 'Register Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
