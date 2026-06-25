import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, mockBookings } from '../lib/mockData';
import { useAuth } from './AuthContext';
import { useInvoices } from './InvoiceContext';
import { useSettings } from './SettingsContext';
import { processReferralReward } from '../lib/referralActions';
import { getCancellationOutcome, CancellationOutcome } from '../lib/cancellation';

interface BookingContextType {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  markBookingPaid: (id: string) => Promise<string>;
  cancelBooking: (id: string) => Promise<CancellationOutcome>;
  rescheduleBooking: (id: string, newDate: string, newTime: string) => Promise<void>;
  getBookingsForParent: (parentId: string, parentEmail?: string) => Booking[];
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
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Booking ids in the seed data (booking1, booking2, ...) are fixed, so
  // concurrent seeding from two devices on first-ever load overwrites the
  // same documents instead of creating duplicates — see CoachContext for
  // the same pattern with more detail.
  const hasSeeded = useRef(false);

  useEffect(() => {
    // Bookings require being signed in to read (see firestore.rules) — but
    // public pages like the homepage render before anyone's logged in.
    // Without this check, every visitor would hit a permission error just
    // browsing the site, and the page would be stuck waiting on data that
    // will never arrive until they log in.
    if (!currentUser) {
      setBookings([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
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
  }, [currentUser]);

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
    await updateDoc(doc(db, COLLECTION, id), { status, statusUpdatedAt: new Date().toISOString() });
  };

  const { createInvoice } = useInvoices();
  const { settings } = useSettings();

  const markBookingPaid = async (id: string): Promise<string> => {
    const booking = bookings.find((b) => b.id === id);
    await updateDoc(doc(db, COLLECTION, id), { paid: true, paidAt: new Date().toISOString() });

    // Every confirmed payment gets a real, sequentially-numbered invoice —
    // this isn't a separate optional step, it's part of what "mark as
    // paid" actually means for the business.
    if (booking) {
      const invoice = await createInvoice({
        bookingId: booking.id,
        parentId: booking.parentId,
        coachId: booking.coachId,
      });
      await updateDoc(doc(db, COLLECTION, id), { invoiceNumber: invoice.invoiceNumber });

      // If this is the qualifying first paid booking for a referred
      // customer, this unlocks their referrer's reward. Best-effort —
      // never undoes the payment confirmation itself if it fails.
      if (settings.referralProgramEnabled) {
        processReferralReward(booking.parentId, settings.referralDiscountPercent);
      }

      return invoice.invoiceNumber;
    }
    return '';
  };

  const getBookingsForParent = (parentId: string, parentEmail?: string) =>
    bookings.filter((b) => b.parentId === parentId || (parentEmail && b.parentEmail === parentEmail));

  const getBookingsForCoach = (coachId: string) =>
    bookings.filter((b) => b.coachId === coachId);

  const cancelBooking = async (id: string): Promise<CancellationOutcome> => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) throw new Error('Booking not found');

    // Refund is based on the FULL amount actually paid — session price
    // plus service fee plus VAT — not just the session price component.
    // Using only booking.price here would shortchange every customer by
    // their fee + VAT on every cancellation, full-refund tier or not.
    const totalPaid = booking.price + (booking.serviceFee || 0) + (booking.vatAmount || 0);
    const outcome = getCancellationOutcome(booking.date, booking.time, totalPaid, settings);

    // Critical: only issue credit if money was actually collected for
    // this booking. Payment happens manually via WhatsApp after a
    // request is made, so most pending/accepted bookings are unpaid at
    // the time of cancellation — without this check, anyone could
    // repeatedly book then cancel and accumulate unlimited free credit
    // for sessions they never paid a single dirham for.
    const actualRefundCreditAmount = booking.paid ? outcome.refundCreditAmount : 0;

    await updateDoc(doc(db, COLLECTION, id), {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      refundCreditAmount: actualRefundCreditAmount,
      cancellationPenaltyPercent: booking.paid ? outcome.penaltyPercent : 0,
    });

    if (actualRefundCreditAmount > 0) {
      const userRef = doc(db, 'users', booking.parentId);
      const userSnap = await getDoc(userRef);
      const currentCredit = userSnap.exists() ? (userSnap.data().creditBalance as number) || 0 : 0;
      await updateDoc(userRef, { creditBalance: currentCredit + actualRefundCreditAmount });
    }

    return { ...outcome, refundCreditAmount: actualRefundCreditAmount };
  };

  const rescheduleBooking = async (id: string, newDate: string, newTime: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) throw new Error('Booking not found');

    // Re-checked here too, not just in the UI that offers the option —
    // the 24h cutoff is a real policy boundary, not just a suggestion.
    // Only outcome.canReschedule is used below, which depends purely on
    // hours-until-session, not price — so the price argument here is a
    // placeholder, not a financial calculation.
    const outcome = getCancellationOutcome(booking.date, booking.time, 0, settings);
    if (!outcome.canReschedule) {
      throw new Error('Rescheduling is only available more than 24 hours before the original session.');
    }

    await updateDoc(doc(db, COLLECTION, id), {
      date: newDate,
      time: newTime,
      status: 'pending', // the coach re-confirms the new slot, same as a fresh request
      statusUpdatedAt: new Date().toISOString(),
      rescheduledAt: new Date().toISOString(),
      rescheduledFrom: { date: booking.date, time: booking.time },
    });
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        loading,
        error,
        addBooking,
        updateBookingStatus,
        markBookingPaid,
        cancelBooking,
        rescheduleBooking,
        getBookingsForParent,
        getBookingsForCoach,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}
