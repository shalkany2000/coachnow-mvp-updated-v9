import { createContext, useContext, useState, ReactNode } from 'react';
import { Booking, mockBookings } from '../lib/mockData';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  markBookingPaid: (id: string) => void;
  getBookingsForParent: (parentId: string) => Booking[];
  getBookingsForCoach: (coachId: string) => Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used within BookingProvider');
  return ctx;
}

// Lazy initial state reads localStorage synchronously on first render,
// instead of starting from [] and populating via useEffect after mount —
// the old approach caused every dashboard to briefly flash an empty/zero
// state on every page load before the real bookings appeared.
function loadInitialBookings(): Booking[] {
  try {
    const stored = localStorage.getItem('coachnow_bookings');
    if (stored) return JSON.parse(stored);
  } catch {
    // fall through to defaults
  }
  localStorage.setItem('coachnow_bookings', JSON.stringify(mockBookings));
  return mockBookings;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(loadInitialBookings);

  const saveBookings = (updated: Booking[]) => {
    setBookings(updated);
    localStorage.setItem('coachnow_bookings', JSON.stringify(updated));
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    saveBookings([...bookings, newBooking]);
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    saveBookings(updated);
  };

  const markBookingPaid = (id: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, paid: true, paidAt: new Date().toISOString() } : b);
    saveBookings(updated);
  };

  const getBookingsForParent = (parentId: string) =>
    bookings.filter(b => b.parentId === parentId);

  const getBookingsForCoach = (coachId: string) =>
    bookings.filter(b => b.coachId === coachId);

  return (
    <BookingContext.Provider value={{
      bookings,
      addBooking,
      updateBookingStatus,
      markBookingPaid,
      getBookingsForParent,
      getBookingsForCoach,
    }}>
      {children}
    </BookingContext.Provider>
  );
}
