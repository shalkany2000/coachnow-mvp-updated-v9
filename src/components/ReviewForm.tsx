import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/Button';
import { useReviews } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from '../lib/mockData';

interface ReviewFormProps {
  booking: Booking;
  onDone: () => void;
}

export function ReviewForm({ booking, onDone }: ReviewFormProps) {
  const { currentUser } = useAuth();
  const { addReview } = useReviews();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!currentUser) return;
    setLoading(true); setError('');
    try {
      await addReview({
        coachId: booking.coachId,
        bookingId: booking.id,
        parentId: currentUser.id,
        parentName: currentUser.name,
        rating,
        comment: comment.trim(),
      });
      onDone();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError("Couldn't submit your review — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-3 space-y-3">
      <p className="text-sm font-semibold text-gray-800">How was your session with {booking.coachName}?</p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                n <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional — tell other parents about your experience..."
        rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} loading={loading}>
          Submit Review
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
