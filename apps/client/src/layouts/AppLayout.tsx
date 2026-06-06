import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiClient } from '@/lib/apiClient';
import {
  BarChart3,
  FileText,
  ShoppingCart,
  Users,
  CheckCircle,
  Boxes,
  Bell,
  LogOut,
  Menu,
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notifications count
    apiClient.get('/notifications/unread').then((res) => {
      setUnreadCount(res.data.data.count);
    }).catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinksForRole = (role?: string) => {
    if (role === 'VENDOR') {
      return [
        { label: 'Active RFQs', icon: FileText, href: '/vendor/rfqs' },
        { label: 'My Quotations', icon: FileText, href: '/vendor/quotations' },
        { label: 'Purchase Orders', icon: ShoppingCart, href: '/vendor/purchase-orders' },
        { label: 'Invoices', icon: BarChart3, href: '/vendor/invoices' },
      ];
    }

    const links = [
      { label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
      { label: 'Vendors', icon: Users, href: '/vendors' },
      { label: 'RFQs', icon: FileText, href: '/rfqs' },
      { label: 'Quotations', icon: FileText, href: '/quotations' },
    ];

    if (role === 'ADMIN' || role === 'MANAGER') {
      links.push({ label: 'Approvals', icon: CheckCircle, href: '/approvals' });
    }

    links.push(
      { label: 'Purchase Orders', icon: ShoppingCart, href: '/purchase-orders' },
      { label: 'Invoices', icon: BarChart3, href: '/invoices' }
    );

    return links;
  };

  const sidebarLinks = getLinksForRole(user?.role);

  return (
    <div className="flex min-h-screen bg-neutral-50" id="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center gap-3 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && <span className="text-lg font-bold tracking-tight text-white">VendorBridge</span>}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={location.pathname.startsWith(link.href) ? 'sidebar-link-active' : 'sidebar-link'}
              title={link.label}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-800">
          <button onClick={handleLogout} className="sidebar-link w-full text-left" id="logout-btn">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="btn-ghost p-2 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-neutral-900 capitalize">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 rounded-lg relative" id="notification-bell">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 ml-2 border-l border-neutral-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                <p className="text-xs text-neutral-500">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-neutral-50 p-6">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
