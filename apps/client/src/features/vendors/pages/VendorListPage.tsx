import { useState } from 'react';
import { useVendors } from '../api/vendorApi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Plus, Search, MapPin, Building2, Phone } from 'lucide-react';

export default function VendorListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useVendors(searchTerm ? `?search=${searchTerm}` : '');
  const user = useAuthStore((s) => s.user);
  const canCreateVendor = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Vendors</h2>
          <p className="text-neutral-500 text-sm">Manage your supplier directory and performance.</p>
        </div>
        {canCreateVendor && (
          <Link to="/vendors/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search vendors by name, GST, or category..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Vendor Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 min-h-[200px] flex flex-col">
              <div className="skeleton h-6 w-3/4 mb-4" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-danger-600 bg-danger-50 border-danger-100">
          Failed to load vendors. Please try again.
        </div>
      ) : data?.vendors.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <Building2 className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No vendors found</h3>
          <p className="text-neutral-500 mb-6">You haven't added any vendors yet, or no vendors match your search.</p>
          {canCreateVendor && (
            <Link to="/vendors/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Add your first vendor
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.vendors?.map((vendor: any) => (
            <Link key={vendor.id} to={`/vendors/${vendor.id}`} className="card-hover p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-brand-600" />
                </div>
                <span className={`badge ${
                  vendor.status === 'ACTIVE' ? 'badge-active' :
                  vendor.status === 'INACTIVE' ? 'badge-draft' :
                  vendor.status === 'PENDING_VERIFICATION' ? 'badge-pending' : 'badge-danger'
                }`}>
                  {vendor.status?.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-neutral-900 mb-1 truncate">{vendor.company_name}</h3>
              <p className="text-sm text-neutral-500 mb-1 truncate">{vendor.name}</p>
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                <span className="bg-neutral-100 px-2 py-0.5 rounded text-xs font-medium">
                  {vendor.category || 'General'}
                </span>
              </div>

              <div className="space-y-2 mt-auto pt-4 border-t border-neutral-100 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="truncate">{vendor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span>{vendor.phone || 'No phone'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
