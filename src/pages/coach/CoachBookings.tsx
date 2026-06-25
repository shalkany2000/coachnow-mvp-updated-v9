import { useState } from 'react';
import { LayoutDashboard, User, BookOpen, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BookingCard } from '../../components/bookings/BookingCard';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'My Profile', path: '/coach/profile-setup', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/coach/bookings', icon: <BookOpen className="w-full h-full" /> },
  { label: 'Schedule', path: '/coach/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Earnings', path: '/coach/earnings', icon: <DollarSign className="w-full h-full" /> },
];

const TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Declined', 'Cancelled'];

export function CoachBookings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { bookings, updateBookingStatus } = useBookings();
  const { coaches } = useCoaches();
  const [activeTab, setActiveTab] = useState('All');
  const [actionError, setActionError] = useState('');

  const coachProfile = coaches.find(c =>
    c.userId === currentUser?.id || c.email === currentUser?.email
  );

  const coachBookings = coachProfile ? bookings.filter(b => b.coachId === coachProfile.id) : [];

  const handleStatusChange = async (id: string, status: 'accepted' | 'rejected' | 'completed') => {
    setActionError('');
    try {
      await updateBookingStatus(id, status);
      if (status === 'accepted' || status === 'rejected') {
        const booking = coachBookings.find((b) => b.id === id);
        if (booking) {
          fetch('/api/booking-status-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking, status }),
          }).catch((err) => console.warn('Status update email could not be sent:', err));
        }
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
      setActionError("Couldn't update that booking — check your connection and try again.");
    }
  };

  const filtered = coachBookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return b.status === 'pending';
    if (activeTab === 'Confirmed') return b.status === 'accepted';
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Declined') return b.status === 'rejected';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Coach Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Booking Requests</h1>
          <p className="text-gray-500 mt-1">{coachBookings.length} total bookings · {coachBookings.filter(b => b.status === 'pending').length} pending</p>
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
                  ({coachBookings.filter(b => {
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

        {actionError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {actionError}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-6">Complete your profile to start receiving booking requests.</p>
            <Button onClick={() => navigate('/coach/profile-setup')}>
              Complete Profile
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role="coach"
                onAccept={(id) => handleStatusChange(id, 'accepted')}
                onReject={(id) => handleStatusChange(id, 'rejected')}
                onComplete={(id) => handleStatusChange(id, 'completed')}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
