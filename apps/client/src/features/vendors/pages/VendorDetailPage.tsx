import { useParams, Link } from 'react-router-dom';
import { useVendor } from '../api/vendorApi';
import { ArrowLeft, Building2, Mail, Phone, MapPin, CreditCard, Hash, Tag } from 'lucide-react';

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vendor, isLoading, error } = useVendor(id!);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-6 w-64" />
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="card p-8 text-center text-danger-600 bg-danger-50 max-w-lg mx-auto mt-12">
        Vendor not found.
        <Link to="/vendors" className="btn-secondary mt-4 mx-auto">Back to Vendors</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/vendors" className="btn-ghost p-2 -ml-2 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-neutral-900">{vendor.company_name}</h2>
          <p className="text-neutral-500 text-sm">Vendor Details</p>
        </div>
        <span className={`badge ${vendor.status === 'ACTIVE' ? 'badge-active' : vendor.status === 'INACTIVE' ? 'badge-draft' : 'badge-danger'}`}>
          {vendor.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-brand-500" />Company Information</h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div><p className="label">Contact Person</p><p className="text-sm font-medium">{vendor.contact_name}</p></div>
              <div><p className="label flex items-center gap-1"><Mail className="w-3 h-3" />Email</p><p className="text-sm font-medium">{vendor.contact_email}</p></div>
              <div><p className="label flex items-center gap-1"><Phone className="w-3 h-3" />Phone</p><p className="text-sm font-medium">{vendor.contact_phone || '—'}</p></div>
              <div><p className="label flex items-center gap-1"><Hash className="w-3 h-3" />GST</p><p className="text-sm font-medium font-mono">{vendor.gst_number || '—'}</p></div>
              <div><p className="label">PAN</p><p className="text-sm font-medium font-mono">{vendor.pan_number || '—'}</p></div>
            </div>
          </div>

          {/* Address */}
          {vendor.address && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-500" />Address</h3>
              <p className="text-sm text-neutral-700">
                {(vendor.address as any).line1}<br />
                {(vendor.address as any).line2 && <>{(vendor.address as any).line2}<br /></>}
                {(vendor.address as any).city}, {(vendor.address as any).state} {(vendor.address as any).pincode}<br />
                {(vendor.address as any).country}
              </p>
            </div>
          )}

          {/* Bank */}
          {vendor.bank_details && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-500" />Bank Details</h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div><p className="label">Bank Name</p><p className="text-sm font-medium">{(vendor.bank_details as any).bank_name || '—'}</p></div>
                <div><p className="label">Account Number</p><p className="text-sm font-medium font-mono">{(vendor.bank_details as any).account_number || '—'}</p></div>
                <div><p className="label">IFSC Code</p><p className="text-sm font-medium font-mono">{(vendor.bank_details as any).ifsc_code || '—'}</p></div>
                <div><p className="label">Branch</p><p className="text-sm font-medium">{(vendor.bank_details as any).branch || '—'}</p></div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-brand-500" />Categories</h3>
            <div className="flex flex-wrap gap-2">
              {vendor.categories?.length ? vendor.categories.map((c: string) => (
                <span key={c} className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm">{c}</span>
              )) : <p className="text-sm text-neutral-500">No categories assigned</p>}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-500 mb-3">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div><p className="text-neutral-400">Registered</p><p className="font-medium">{new Date(vendor.created_at).toLocaleDateString()}</p></div>
              <div><p className="text-neutral-400">Last Updated</p><p className="font-medium">{new Date(vendor.updated_at).toLocaleDateString()}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
