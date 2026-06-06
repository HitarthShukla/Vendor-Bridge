import { useState } from 'react';
import { useRfqs } from '../api/rfqApi';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Plus, Search, Calendar, FileText, PackageOpen, Clock } from 'lucide-react';

export default function RFQListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useRfqs(searchTerm ? `?search=${searchTerm}` : '');
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Determine if this is the vendor portal view
  const isVendorView = user?.role === 'VENDOR' || location.pathname.startsWith('/vendor');
  const canCreateRfq = !isVendorView && (user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER');

  // Build the correct detail link prefix based on context
  const detailPrefix = isVendorView ? '/vendor/rfqs' : '/rfqs';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            {isVendorView ? 'Active RFQs' : 'Requests for Quotation'}
          </h2>
          <p className="text-neutral-500 text-sm">
            {isVendorView
              ? 'Browse open procurement requests and submit your bids.'
              : 'Create and manage your procurement requests.'}
          </p>
        </div>
        {canCreateRfq && (
          <Link to="/rfqs/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Create RFQ
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search RFQs by number or title..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* RFQ List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 flex gap-6 items-center">
              <div className="skeleton w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-danger-600 bg-danger-50 border-danger-100">
          Failed to load RFQs. Please try again.
        </div>
      ) : data?.rfqs?.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <PackageOpen className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No RFQs found</h3>
          <p className="text-neutral-500 mb-6">
            {isVendorView
              ? 'No open procurement requests are available right now. Check back later.'
              : 'Create your first Request for Quotation to start receiving bids.'}
          </p>
          {canCreateRfq && (
            <Link to="/rfqs/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Create RFQ
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.rfqs?.map((rfq: any) => (
            <Link key={rfq.id} to={`${detailPrefix}/${rfq.id}`} className="card-hover p-6 flex flex-col md:flex-row md:items-center gap-6">
              {/* Icon & ID */}
              <div className="flex items-center gap-4 md:w-1/4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  rfq.status === 'PUBLISHED' ? 'bg-brand-50 text-brand-600' :
                  rfq.status === 'CLOSED' ? 'bg-neutral-100 text-neutral-500' : 'bg-warning-50 text-warning-600'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 truncate">{rfq.rfq_number}</h3>
                  <span className={`badge mt-1 ${
                    rfq.status === 'PUBLISHED' ? 'badge-active' :
                    rfq.status === 'CLOSED' ? 'badge-danger' : 'badge-draft'
                  }`}>
                    {rfq.status}
                  </span>
                </div>
              </div>

              {/* Title & Deadline */}
              <div className="flex-1">
                <p className="text-neutral-900 font-medium mb-1 line-clamp-1">{rfq.title}</p>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(rfq.submission_deadline || rfq.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Created: {new Date(rfq.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 md:w-1/4 md:justify-end">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900">{rfq.items?.length || 0}</p>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Items</p>
                </div>
                {!isVendorView && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-900">{rfq.vendors?.length || 0}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Vendors</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
