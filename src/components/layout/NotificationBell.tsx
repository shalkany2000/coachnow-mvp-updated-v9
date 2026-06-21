import { useRef } from 'react';
import { Bell, Calendar, DollarSign, UserPlus, Star } from 'lucide-react';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { AdminNotification } from '../../hooks/useAdminNotifications';
import { formatRelativeTime } from '../../utils/time';

const notificationIcons = {
  booking: <Calendar className="w-4 h-4" />,
  payment: <DollarSign className="w-4 h-4" />,
  signup: <UserPlus className="w-4 h-4" />,
  review: <Star className="w-4 h-4" />,
};

interface NotificationBellProps {
  notifications: AdminNotification[];
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (link: string) => void;
  size?: 'sm' | 'md';
}

export function NotificationBell({ notifications, unreadCount, open, onToggle, onClose, onNavigate, size = 'md' }: NotificationBellProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose, open);

  const btnPad = size === 'sm' ? 'p-2' : 'p-2.5';
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-5 h-5';
  const badgeClass = size === 'sm'
    ? 'absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 text-[9px]'
    : 'absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px]';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        aria-label="Notifications"
        className={`relative ${btnPad} hover:bg-gray-100 rounded-xl transition-colors`}
      >
        <Bell className={`${iconSize} text-gray-600`} />
        {unreadCount > 0 && (
          <span className={`${badgeClass} bg-red-500 text-white font-bold rounded-full flex items-center justify-center`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[88vw] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Nothing yet — new bookings and signups will show up here.
            </p>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => onNavigate(n.link)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.kind === 'booking' ? 'bg-blue-50 text-blue-600' :
                  n.kind === 'payment' ? 'bg-emerald-50 text-emerald-600' :
                  n.kind === 'review' ? 'bg-amber-50 text-amber-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  {notificationIcons[n.kind]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.timestamp)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
