import { useMemo, useState } from 'react';
import { useBookings } from '../contexts/BookingContext';
import { useFirestoreCollection } from './useFirestoreCollection';
import { mockUsers, User } from '../lib/mockData';

const SEEN_KEY = 'coachnow_admin_notifications_seen_at';

export interface AdminNotification {
  id: string;
  message: string;
  timestamp: string; // ISO
  link: string;
  kind: 'booking' | 'payment' | 'signup';
}

// Builds a real notification feed from data that already exists — new
// booking requests, confirmed payments, and new signups — rather than a
// fake/decorative bell. There's no backend pushing events, so "unread"
// just means "happened after the last time the admin opened this panel".
export function useAdminNotifications() {
  const { bookings } = useBookings();
  const { data: registeredUsers } = useFirestoreCollection<User>('users');
  const [seenAt, setSeenAt] = useState<string>(() => {
    try {
      return localStorage.getItem(SEEN_KEY) || '';
    } catch {
      return '';
    }
  });

  const notifications = useMemo<AdminNotification[]>(() => {
    const items: AdminNotification[] = [];

    bookings.forEach(b => {
      items.push({
        id: `booking-${b.id}`,
        message: `${b.parentName} booked ${b.coachName} for ${b.sportType}`,
        timestamp: b.createdAt,
        link: '/admin/bookings',
        kind: 'booking',
      });
      if (b.paid && b.paidAt) {
        items.push({
          id: `payment-${b.id}`,
          message: `Payment confirmed — AED ${b.price} from ${b.parentName}`,
          timestamp: b.paidAt,
          link: '/admin/bookings',
          kind: 'payment',
        });
      }
    });

    // Demo account logins also pass through saveToDirectory (see
    // AuthContext), so exclude the 3 seeded demo accounts to avoid
    // "new signup" noise every time someone clicks a demo login button.
    registeredUsers
      .filter(u => !mockUsers.some(m => m.email.toLowerCase() === u.email.toLowerCase()))
      .forEach(u => {
        items.push({
          id: `signup-${u.id}`,
          message: `New ${u.role} signed up: ${u.name}`,
          timestamp: u.createdAt,
          link: '/admin/users',
          kind: 'signup',
        });
      });

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [bookings, registeredUsers]);

  const unreadCount = notifications.filter(n => !seenAt || n.timestamp > seenAt).length;

  const markAllSeen = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(SEEN_KEY, now);
    } catch {
      // localStorage unavailable — badge just won't persist across reloads
    }
    setSeenAt(now);
  };

  return { notifications, unreadCount, markAllSeen };
}
