import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Star, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { visibleCoaches } from '../../lib/sports';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CoachCard } from '../../components/coaches/CoachCard';
import { ReferralCard } from '../../components/ReferralCard';
import {
  Users, Home, BookOpen, Dumbbell,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Home', path: '/parent/home', icon: <Home className="w-full h-full" /> },
  { label: 'Find Coaches', path: '/coaches', icon: <Search className="w-full h-full" /> },
  { label: 'My Bookings', path: '/parent/bookings', icon: <BookOpen className="w-full h-full" /> },
];

const statusConfig = {
  pending: { label: 'Pending', variant: 'yellow' as const },
  accepted: { label: 'Confirmed', variant: 'green' as const },
  rejected: { label: 'Declined', variant: 'red' as const },
  completed: { label: 'Completed', variant: 'blue' as const },
};

export function ParentHome() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getBookingsForParent } = useBookings();
  const { coaches } = useCoaches();

  const bookings = currentUser ? getBookingsForParent(currentUser.id, currentUser.email) : [];
  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'accepted').slice(0, 3);
  const topCoaches = visibleCoaches(coaches).filter(c => c.verified && !c.onLeave).sort((a, b) => b.rating - a.rating).slice(0, 3);

  const firstName = currentUser?.name.split(' ')[0] || 'there';

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Parent Dashboard">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">Hey, {firstName}! 👋</h1>
              <p className="text-blue-100 mt-1">Ready to book your next session?</p>
            </div>
            <Button
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold"
              size="lg"
              onClick={() => navigate('/coaches')}
            >
              <Search className="w-5 h-5" />
              Find a Coach
            </Button>
          </div>
        </div>

        <ReferralCard />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: <Calendar className="w-5 h-5" />, color: 'blue' },
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'accepted').length, icon: <Star className="w-5 h-5" />, color: 'green' },
            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: <TrendingUp className="w-5 h-5" />, color: 'yellow' },
            { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: <Users className="w-5 h-5" />, color: 'purple' },
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
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Upcoming Bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Sessions</h2>
            <button
              onClick={() => navigate('/parent/bookings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {upcomingBookings.length === 0 ? (
            <Card className="text-center py-10">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-bold text-gray-900 mb-1">No upcoming sessions</h3>
              <p className="text-gray-500 text-sm mb-4">Book your first session with a top coach!</p>
              <Button onClick={() => navigate('/coaches')}>
                <Search className="w-4 h-4" />
                Browse Coaches
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(booking => {
                const status = statusConfig[booking.status];
                return (
                  <Card key={booking.id} hover className="flex items-center gap-4" onClick={() => navigate('/parent/bookings')}>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{booking.coachName}</p>
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(booking.date).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short' })} · {booking.time} · {booking.sportType}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">AED {booking.price}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommended Coaches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Top Coaches for You</h2>
            <button
              onClick={() => navigate('/coaches')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCoaches.map(coach => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
