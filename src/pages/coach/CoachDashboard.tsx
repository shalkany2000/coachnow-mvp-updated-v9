import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, BookOpen, Calendar, TrendingUp, DollarSign, Clock, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BookingCard } from '../../components/bookings/BookingCard';

const sidebarItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'My Profile', path: '/coach/profile-setup', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/coach/bookings', icon: <BookOpen className="w-full h-full" /> },
  { label: 'Schedule', path: '/coach/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Earnings', path: '/coach/earnings', icon: <DollarSign className="w-full h-full" /> },
];

export function CoachDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { bookings, updateBookingStatus } = useBookings();
  const { coaches } = useCoaches();

  // Match this coach's own profile by account id first (set when they
  // complete profile setup). Falling back to coaches[0] here used to mean a
  // brand-new coach saw Ahmed's bookings/earnings instead of their own — so
  // that fallback has been removed; the page below already handles
  // coachProfile being undefined.
  const coachProfile = coaches.find(c =>
    c.userId === currentUser?.id || c.email === currentUser?.email
  );

  const coachBookings = coachProfile ? bookings.filter(b => b.coachId === coachProfile.id) : [];
  const pendingBookings = coachBookings.filter(b => b.status === 'pending');
  const acceptedBookings = coachBookings.filter(b => b.status === 'accepted');
  const completedBookings = coachBookings.filter(b => b.status === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.coachEarnings, 0);
  const pendingEarnings = acceptedBookings.reduce((sum, b) => sum + b.coachEarnings, 0);

  const firstName = currentUser?.name.split(' ')[0] || 'Coach';

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Coach Dashboard">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">Welcome, {firstName}! 🏆</h1>
              <p className="text-emerald-100 mt-1">
                {pendingBookings.length > 0
                  ? `You have ${pendingBookings.length} pending booking request${pendingBookings.length > 1 ? 's' : ''}!`
                  : 'Your dashboard looks great. Keep up the great work!'}
              </p>
            </div>
            {pendingBookings.length > 0 && (
              <Button
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold"
                onClick={() => navigate('/coach/bookings')}
              >
                Review Requests
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: coachBookings.length, icon: <BookOpen className="w-5 h-5" />, color: 'blue' },
            { label: 'Pending', value: pendingBookings.length, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
            { label: 'Completed', value: completedBookings.length, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
            { label: 'Total Earned', value: `AED ${totalEarnings}`, icon: <DollarSign className="w-5 h-5" />, color: 'purple' },
          ].map(stat => (
            <Card key={stat.label} padding="sm">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 
                ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                ${stat.color === 'green' ? 'bg-green-50 text-green-600' : ''}
                ${stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' : ''}
                ${stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : ''}
              `}>
                {stat.icon}
              </div>
              <div className="text-xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Pending Requests
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingBookings.length}
                </span>
              </h2>
              <button
                onClick={() => navigate('/coach/bookings')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-4">
              {pendingBookings.slice(0, 2).map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  role="coach"
                  onAccept={(id) => updateBookingStatus(id, 'accepted')}
                  onReject={(id) => updateBookingStatus(id, 'rejected')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Earnings Preview */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Earnings Overview</h2>
              <button onClick={() => navigate('/coach/earnings')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Details →
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Earned (completed)</span>
                </div>
                <span className="font-bold text-green-700">AED {totalEarnings}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Upcoming (confirmed)</span>
                </div>
                <span className="font-bold text-blue-700">AED {pendingEarnings}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Profile Status</h2>
            </div>
            {coachProfile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sport</span>
                  <Badge variant={coachProfile.sportType ? 'green' : 'gray'} size="sm">
                    {coachProfile.sportType || 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <Badge variant={coachProfile.pricePerHour ? 'green' : 'gray'} size="sm">
                    {coachProfile.pricePerHour ? `AED ${coachProfile.pricePerHour}/session` : 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Location</span>
                  <Badge variant={coachProfile.location ? 'green' : 'gray'} size="sm">
                    {coachProfile.location || 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verified</span>
                  <Badge variant={coachProfile.verified ? 'green' : 'yellow'} size="sm">
                    {coachProfile.verified ? '✓ Verified' : 'Pending'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/coach/profile-setup')} className="mt-2">
                  Edit Profile
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">Profile not set up yet</p>
                <Button size="sm" fullWidth onClick={() => navigate('/coach/profile-setup')}>
                  Set Up Profile
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Bookings */}
        {coachBookings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
              <button
                onClick={() => navigate('/coach/bookings')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-4">
              {coachBookings.slice(0, 3).map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  role="coach"
                  onAccept={(id) => updateBookingStatus(id, 'accepted')}
                  onReject={(id) => updateBookingStatus(id, 'rejected')}
                  onComplete={(id) => updateBookingStatus(id, 'completed')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
