import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Review } from '../lib/mockData';
import { useCoaches } from './CoachContext';

interface ReviewContextType {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  getReviewsForCoach: (coachId: string) => Review[];
  hasReviewedBooking: (bookingId: string) => boolean;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function useReviews() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewProvider');
  return ctx;
}

const COLLECTION = 'reviews';

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateCoach } = useCoaches();

  useEffect(() => {
    // Reviews are public (shown on coach profile pages to any visitor),
    // so this subscribes unconditionally — no auth gate needed, unlike
    // bookings.
    const ref = collection(db, COLLECTION);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setReviews(snapshot.docs.map((d) => d.data() as Review));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Reviews subscription error:', err);
        setError('Could not load reviews right now.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const getReviewsForCoach = (coachId: string) =>
    [...reviews]
      .filter((r) => r.coachId === coachId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasReviewedBooking = (bookingId: string) => reviews.some((r) => r.bookingId === bookingId);

  const addReview = async (review: Omit<Review, 'id' | 'createdAt'>) => {
    // The review document id is the booking id on purpose — Firestore
    // rules only allow *creating* a review at an id that doesn't exist yet
    // and deny all updates, so this naturally caps it at one review per
    // booking without needing a separate uniqueness check.
    const newReview: Review = {
      ...review,
      id: review.bookingId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTION, review.bookingId), newReview);

    // Recompute this coach's aggregate rating from all their reviews
    // (including the one just added). The Firestore rules specifically
    // allow any signed-in person to update *only* the rating/reviewCount
    // fields on a coach doc, precisely so this can happen without needing
    // a Cloud Function.
    const coachReviews = [...reviews.filter((r) => r.coachId === review.coachId), newReview];
    const avg = coachReviews.reduce((sum, r) => sum + r.rating, 0) / coachReviews.length;
    await updateCoach(review.coachId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: coachReviews.length,
    });
  };

  return (
    <ReviewContext.Provider value={{ reviews, loading, error, getReviewsForCoach, hasReviewedBooking, addReview }}>
      {children}
    </ReviewContext.Provider>
  );
}
