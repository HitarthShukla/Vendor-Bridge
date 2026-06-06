import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Bell, Check, CheckCheck, Clock, FileText, ShoppingCart, Users, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/notifications').then((r) => setNotifications(r.data.data?.notifications || r.data.data || [])).catch(console.error).finally(() => setLoading(false));
    }
  }, [isOpen]);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const getIcon = (type: string) => {
    const map: Record<string, React.ReactNode> = {
      RFQ: <FileText className="w-4 h-4 text-brand-600" />,
      APPROVAL: <Clock className="w-4 h-4 text-warning-600" />,
      PO: <ShoppingCart className="w-4 h-4 text-success-600" />,
      VENDOR: <Users className="w-4 h-4 text-neutral-600" />,
    };
    return map[type] || <Bell className="w-4 h-4 text-neutral-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Notifications</h2>
            <p className="text-xs text-neutral-500">{notifications.filter((n) => !n.is_read).length} unread</p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="btn-ghost text-xs py-1 px-2"><CheckCheck className="w-3.5 h-3.5" />Mark all read</button>
            <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-neutral-100 flex gap-3"><div className="skeleton w-8 h-8 rounded-full" /><div className="flex-1"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-32" /></div></div>
            ))
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell className="w-12 h-12 text-neutral-200 mb-4" />
              <p className="text-neutral-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-6 py-4 border-b border-neutral-100 flex gap-3 cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : 'bg-brand-50/30 hover:bg-brand-50/50'}`}
                onClick={() => markRead(n.id)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-neutral-100' : 'bg-brand-100'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.is_read ? 'text-neutral-500' : 'text-neutral-900 font-medium'}`}>{n.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-neutral-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
