import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, mockBookings } from '../lib/mockData';

interface BookingContextType {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  markBookingPaid: (id: string) => Promise<void>;
  getBookingsForParent: (parentId: string) => Booking[];
  getBookingsForCoach: (coachId: string) => Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used within BookingProvider');
  return ctx;
}

const COLLECTION = 'bookings';

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Booking ids in the seed data (booking1, booking2, ...) are fixed, so
  // concurrent seeding from two devices on first-ever load overwrites the
  // same documents instead of creating duplicates — see CoachContext for
  // the same pattern with more detail.
  const hasSeeded = useRef(false);

  useEffect(() => {
    const bookingsRef = collection(db, COLLECTION);

    const unsubscribe = onSnapshot(
      bookingsRef,
      async (snapshot) => {
        if (snapshot.empty && !hasSeeded.current) {
          hasSeeded.current = true;
          try {
            await Promise.all(
              mockBookings.map((booking) => setDoc(doc(db, COLLECTION, booking.id), booking))
            );
          } catch (err) {
            console.error('Failed to seed starter bookings:', err);
            setError('Could not load bookings. Check your connection and reload.');
            setLoading(false);
          }
          return;
        }
        setBookings(snapshot.docs.map((d) => d.data() as Booking));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Bookings subscription error:', err);
        setError('Could not load bookings. Check your connection and reload.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const id = `booking_${Date.now()}`;
    const newBooking: Booking = {
      ...booking,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTION, id), newBooking);
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    await updateDoc(doc(db, COLLECTION, id), { status });
  };

  const markBookingPaid = async (id: string) => {
    await updateDoc(doc(db, COLLECTION, id), { paid: true, paidAt: new Date().toISOString() });
  };

  const getBookingsForParent = (parentId: string) =>
    bookings.filter((b) => b.parentId === parentId);

  const getBookingsForCoach = (coachId: string) =>
    bookings.filter((b) => b.coachId === coachId);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        loading,
        error,
        addBooking,
        updateBookingStatus,
        markBookingPaid,
        getBookingsForParent,
        getBookingsForCoach,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}
