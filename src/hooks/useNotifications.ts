import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../contexts/BookingContext';
import { useReviews } from '../contexts/ReviewContext';
import { useCoaches } from '../contexts/CoachContext';
import { useFirestoreCollection } from './useFirestoreCollection';
import { mockUsers, User } from '../lib/mockData';

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string; // ISO
  link: string;
  kind: 'booking' | 'payment' | 'signup' | 'review' | 'accepted' | 'rejected' | 'completed';
}

// Builds a real notification feed from data that already exists, tailored
// to whoever's signed in:
//   - Admin/GM: every new booking, payment, signup, and review platform-wide.
//   - Coach: new requests for them, payments on their sessions, reviews left for them.
//   - Parent: what happened to bookings THEY made — accepted, declined,
//     completed, or paid — so they don't have to keep checking manually.
// There's no backend pushing events, so "unread" just means "happened
// after the last time this person opened the bell" — tracked per-account
// so switching who's logged in on the same device doesn't mix up read state.
export function useNotifications() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isStaff = role === 'admin' || role === 'gm';
  const { bookings } = useBookings();
  const { reviews } = useReviews();
  const { coaches } = useCoaches();
  const { data: registeredUsers } = useFirestoreCollection<User>('users', isStaff);

  const seenKey = currentUser ? `coachnow_notifications_seen_at_${currentUser.id}` : '';
  const [seenAt, setSeenAt] = useState<string>('');

  // Re-sync read-state whenever the signed-in account changes (e.g. one
  // person logs out and a different person logs in on the same device).
  useEffect(() => {
    if (!seenKey) { setSeenAt(''); return; }
    try {
      setSeenAt(localStorage.getItem(seenKey) || '');
    } catch {
      setSeenAt('');
    }
  }, [seenKey]);

  const myCoachProfile = useMemo(
    () => coaches.find(c => c.userId === currentUser?.id || c.email === currentUser?.email),
    [coaches, currentUser]
  );

  const notifications = useMemo<AppNotification[]>(() => {
    if (!currentUser) return [];
    const items: AppNotification[] = [];

    if (isStaff) {
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

      reviews.forEach(r => {
        const coachName = coaches.find(c => c.id === r.coachId)?.name || 'a coach';
        items.push({
          id: `review-${r.id}`,
          message: `${r.parentName} left a ${r.rating}★ review for ${coachName}`,
          timestamp: r.createdAt,
          link: `/coaches/${r.coachId}`,
          kind: 'review',
        });
      });
    } else if (role === 'coach' && myCoachProfile) {
      bookings
        .filter(b => b.coachId === myCoachProfile.id)
        .forEach(b => {
          items.push({
            id: `booking-${b.id}`,
            message: `${b.parentName} requested a session for ${b.sportType}`,
            timestamp: b.createdAt,
            link: '/coach/bookings',
            kind: 'booking',
          });
          if (b.paid && b.paidAt) {
            items.push({
              id: `payment-${b.id}`,
              message: `Payment confirmed — you earned AED ${b.coachEarnings} from ${b.parentName}`,
              timestamp: b.paidAt,
              link: '/coach/bookings',
              kind: 'payment',
            });
          }
        });

      reviews
        .filter(r => r.coachId === myCoachProfile.id)
        .forEach(r => {
          items.push({
            id: `review-${r.id}`,
            message: `${r.parentName} left you a ${r.rating}★ review`,
            timestamp: r.createdAt,
            link: `/coaches/${myCoachProfile.id}`,
            kind: 'review',
          });
        });
    } else if (role === 'parent') {
      bookings
        .filter(b => b.parentId === currentUser.id || b.parentEmail === currentUser.email)
        .forEach(b => {
          if (b.status === 'accepted' && b.statusUpdatedAt) {
            items.push({
              id: `accepted-${b.id}`,
              message: `${b.coachName} accepted your booking for ${b.sportType}`,
              timestamp: b.statusUpdatedAt,
              link: '/parent/bookings',
              kind: 'accepted',
            });
          }
          if (b.status === 'rejected' && b.statusUpdatedAt) {
            items.push({
              id: `rejected-${b.id}`,
              message: `${b.coachName} declined your booking request for ${b.sportType}`,
              timestamp: b.statusUpdatedAt,
              link: '/parent/bookings',
              kind: 'rejected',
            });
          }
          if (b.status === 'completed' && b.statusUpdatedAt) {
            items.push({
              id: `completed-${b.id}`,
              message: `Your session with ${b.coachName} is complete — leave a review!`,
              timestamp: b.statusUpdatedAt,
              link: '/parent/bookings',
              kind: 'completed',
            });
          }
          if (b.paid && b.paidAt) {
            items.push({
              id: `payment-${b.id}`,
              message: `Payment confirmed for your session with ${b.coachName}`,
              timestamp: b.paidAt,
              link: '/parent/bookings',
              kind: 'payment',
            });
          }
        });
    }

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [currentUser, role, isStaff, bookings, registeredUsers, reviews, coaches, myCoachProfile]);

  const unreadCount = notifications.filter(n => !seenAt || n.timestamp > seenAt).length;

  const markAllSeen = () => {
    if (!seenKey) return;
    const now = new Date().toISOString();
    try {
      localStorage.setItem(seenKey, now);
    } catch {
      // localStorage unavailable — badge just won't persist across reloads
    }
    setSeenAt(now);
  };

  return { notifications, unreadCount, markAllSeen };
}
