import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, DollarSign, UserPlus, Star, CheckCircle2, XCircle, PartyPopper, Gift, CalendarX } from 'lucide-react';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { AppNotification } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/time';

const notificationIcons = {
  booking: <Calendar className="w-4 h-4" />,
  payment: <DollarSign className="w-4 h-4" />,
  signup: <UserPlus className="w-4 h-4" />,
  review: <Star className="w-4 h-4" />,
  accepted: <CheckCircle2 className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  completed: <PartyPopper className="w-4 h-4" />,
  referral_reward: <Gift className="w-4 h-4" />,
  cancelled: <CalendarX className="w-4 h-4" />,
};

const notificationColors: Record<AppNotification['kind'], string> = {
  booking: 'bg-blue-50 text-blue-600',
  payment: 'bg-emerald-50 text-emerald-600',
  review: 'bg-amber-50 text-amber-600',
  signup: 'bg-purple-50 text-purple-600',
  accepted: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
  completed: 'bg-indigo-50 text-indigo-600',
  referral_reward: 'bg-pink-50 text-pink-600',
  cancelled: 'bg-orange-50 text-orange-600',
};

interface NotificationBellProps {
  notifications: AppNotification[];
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
        type="button"
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
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[88vw] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[200] max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Nothing yet — new activity on your account will show up here.
            </p>
          ) : (
            notifications.map(n => (
              <Link
                key={n.id}
                to={n.link}
                onClick={() => onNavigate(n.link)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notificationColors[n.kind]}`}>
                  {notificationIcons[n.kind]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.timestamp)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
