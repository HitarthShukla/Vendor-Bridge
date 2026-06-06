import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything
  if (user.role === 'ADMIN') {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    // If not allowed, redirect to a safe default page based on role
    if (user.role === 'VENDOR') return <Navigate to="/vendor/rfqs" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
