import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Lazy-loaded layouts and pages
import { lazy, Suspense } from 'react';

const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const RoleGuard = lazy(() => import('@/components/guards/RoleGuard'));

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const VendorListPage = lazy(() => import('@/features/vendors/pages/VendorListPage'));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-neutral-500">Loading VendorBridge...</p>
      </div>
    </div>
  );
}

// Global auth guard
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Procurement/Admin Routes */}
        <Route
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN']}>
                <AppLayout />
              </RoleGuard>
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorListPage />} />
          <Route path="/rfqs" element={<div>RFQs (WIP)</div>} />
          <Route path="/quotations" element={<div>Quotations (WIP)</div>} />
          <Route path="/approvals" element={<div>Approvals (WIP)</div>} />
          <Route path="/purchase-orders" element={<div>Purchase Orders (WIP)</div>} />
          <Route path="/invoices" element={<div>Invoices (WIP)</div>} />
          <Route path="/reports" element={<div>Reports (WIP)</div>} />
        </Route>

        {/* Protected Vendor Routes */}
        <Route
          path="/vendor"
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['VENDOR']}>
                <AppLayout />
              </RoleGuard>
            </PrivateRoute>
          }
        >
          <Route path="rfqs" element={<div>Vendor Active RFQs (WIP)</div>} />
          <Route path="quotations" element={<div>Vendor Quotations (WIP)</div>} />
          <Route path="purchase-orders" element={<div>Vendor POs (WIP)</div>} />
          <Route path="invoices" element={<div>Vendor Invoices (WIP)</div>} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
