import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { lazy, Suspense } from 'react';

const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const RoleGuard = lazy(() => import('@/components/guards/RoleGuard'));

// Auth
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));

// Dashboard
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));

// Vendors
const VendorListPage = lazy(() => import('@/features/vendors/pages/VendorListPage'));
const VendorCreatePage = lazy(() => import('@/features/vendors/pages/VendorCreatePage'));
const VendorDetailPage = lazy(() => import('@/features/vendors/pages/VendorDetailPage'));

// RFQs
const RFQListPage = lazy(() => import('@/features/rfqs/pages/RFQListPage'));
const RFQCreatePage = lazy(() => import('@/features/rfqs/pages/RFQCreatePage'));
const RFQDetailPage = lazy(() => import('@/features/rfqs/pages/RFQDetailPage'));

// Quotations
const QuotationComparePage = lazy(() => import('@/features/quotations/pages/QuotationComparePage'));

// Approvals
const ApprovalsPage = lazy(() => import('@/features/approvals/pages/ApprovalsPage'));

// Purchase Orders
const POListPage = lazy(() => import('@/features/purchase-orders/pages/POListPage'));

// Invoices
const InvoiceListPage = lazy(() => import('@/features/invoices/pages/InvoiceListPage'));

// Reports
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));

// AI Chat Widget
const AIChatWidget = lazy(() => import('@/features/ai/components/AIChatWidget'));

// Vendor-specific pages
const VendorSubmitQuotationPage = lazy(() => import('@/features/quotations/pages/VendorSubmitQuotationPage'));
const VendorDashboardPage = lazy(() => import('@/features/dashboard/pages/VendorDashboardPage'));

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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Smart default redirect based on role
function DefaultRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'VENDOR') return <Navigate to="/vendor/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ─── Internal Staff Routes (ADMIN / MANAGER / PROCUREMENT_OFFICER) ──── */}
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

          {/* Vendors — viewable by all staff, create/edit by ADMIN + PROCUREMENT */}
          <Route path="/vendors" element={<VendorListPage />} />
          <Route path="/vendors/new" element={
            <RoleGuard allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER']}>
              <VendorCreatePage />
            </RoleGuard>
          } />
          <Route path="/vendors/:id" element={<VendorDetailPage />} />

          {/* RFQs — viewable by all staff, create by ADMIN + PROCUREMENT */}
          <Route path="/rfqs" element={<RFQListPage />} />
          <Route path="/rfqs/new" element={
            <RoleGuard allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER']}>
              <RFQCreatePage />
            </RoleGuard>
          } />
          <Route path="/rfqs/:id" element={<RFQDetailPage />} />

          {/* Quotation Comparison — ADMIN + PROCUREMENT + MANAGER */}
          <Route path="/quotations/compare/:rfqId" element={<QuotationComparePage />} />

          {/* Approvals — MANAGER + ADMIN only */}
          <Route path="/approvals" element={
            <RoleGuard allowedRoles={['MANAGER', 'ADMIN']}>
              <ApprovalsPage />
            </RoleGuard>
          } />

          {/* Purchase Orders — all staff */}
          <Route path="/purchase-orders" element={<POListPage />} />

          {/* Invoices — all staff */}
          <Route path="/invoices" element={<InvoiceListPage />} />

          {/* Reports — ADMIN + MANAGER + PROCUREMENT */}
          <Route path="/reports" element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}>
              <ReportsPage />
            </RoleGuard>
          } />
        </Route>

        {/* ─── Vendor Portal Routes (VENDOR role only) ────────────────────────── */}
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
          <Route path="dashboard" element={<VendorDashboardPage />} />
          <Route path="rfqs" element={<RFQListPage />} />
          <Route path="rfqs/:id" element={<RFQDetailPage />} />
          <Route path="quotations" element={<VendorSubmitQuotationPage />} />
          <Route path="purchase-orders" element={<POListPage />} />
          <Route path="invoices" element={<InvoiceListPage />} />
        </Route>

        {/* Smart default redirect based on role */}
        <Route path="/" element={
          <PrivateRoute><DefaultRedirect /></PrivateRoute>
        } />
        <Route path="*" element={
          <PrivateRoute><DefaultRedirect /></PrivateRoute>
        } />
      </Routes>

      {/* Global AI Chat Widget — visible when authenticated */}
      {isAuthenticated && <AIChatWidget />}
    </Suspense>
  );
}

export default App;
