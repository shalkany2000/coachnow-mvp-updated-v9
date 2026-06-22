import { RefreshCw, WifiOff } from 'lucide-react';
import { useCoaches } from '../contexts/CoachContext';
import { useBookings } from '../contexts/BookingContext';

// Coaches and bookings now live in Firestore instead of localStorage, which
// means the very first load of each is genuinely asynchronous (a real
// network round-trip) rather than the instant synchronous read it used to
// be. Without this gate, every page that reads coaches/bookings would
// render with empty data for a moment before the real data arrives.
export function AppDataGate({ children }: { children: React.ReactNode }) {
  const { loading: coachesLoading, error: coachesError } = useCoaches();
  const { loading: bookingsLoading, error: bookingsError } = useBookings();

  const error = coachesError || bookingsError;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Can't connect right now</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (coachesLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading CoachNow...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
