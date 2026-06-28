import { useState } from 'react';
import { Search, Home, BookOpen, Star, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useReviews } from '../../contexts/ReviewContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BookingCard } from '../../components/bookings/BookingCard';
import { ReviewForm } from '../../components/ReviewForm';
import { Button } from '../../components/ui/Button';

const sidebarItems = [
  { label: 'Home', path: '/parent/home', icon: <Home className="w-full h-full" /> },
  { label: 'Find Academies', path: '/coaches', icon: <Search className="w-full h-full" /> },
  { label: 'My Bookings', path: '/parent/bookings', icon: <BookOpen className="w-full h-full" /> },
];

const TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Declined', 'Cancelled'];

export function ParentBookings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getBookingsForParent } = useBookings();
  const { hasReviewedBooking } = useReviews();
  const [activeTab, setActiveTab] = useState('All');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const allBookings = currentUser ? getBookingsForParent(currentUser.id, currentUser.email) : [];

  const filtered = allBookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return b.status === 'pending';
    if (activeTab === 'Confirmed') return b.status === 'accepted';
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Declined') return b.status === 'rejected';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Parent Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Bookings</h1>
            <p className="text-gray-500 mt-1">{allBookings.length} total bookings</p>
          </div>
          <Button onClick={() => navigate('/coaches')}>
            <Search className="w-4 h-4" />
            Book a Session
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className="ml-1.5 text-xs">
                  ({allBookings.filter(b => {
                    if (tab === 'Pending') return b.status === 'pending';
                    if (tab === 'Confirmed') return b.status === 'accepted';
                    if (tab === 'Completed') return b.status === 'completed';
                    if (tab === 'Declined') return b.status === 'rejected';
                    if (tab === 'Cancelled') return b.status === 'cancelled';
                    return false;
                  }).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'All'
                ? "You haven't made any bookings yet."
                : `No ${activeTab.toLowerCase()} bookings.`}
            </p>
            <Button onClick={() => navigate('/coaches')}>Find an Academy</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(booking => (
              <div key={booking.id}>
                <BookingCard booking={booking} role="parent" />
                {booking.status === 'completed' && (
                  hasReviewedBooking(booking.id) ? (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium mt-2 px-1">
                      <CheckCircle className="w-4 h-4" />
                      You reviewed this session
                    </div>
                  ) : reviewingId === booking.id ? (
                    <ReviewForm booking={booking} onDone={() => setReviewingId(null)} />
                  ) : (
                    <button
                      onClick={() => setReviewingId(booking.id)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold mt-2 px-1 hover:text-blue-700"
                    >
                      <Star className="w-4 h-4" />
                      Leave a review
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
