import { LayoutDashboard, User, BookOpen, Calendar, DollarSign, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const sidebarItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'My Profile', path: '/coach/profile-setup', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/coach/bookings', icon: <BookOpen className="w-full h-full" /> },
  { label: 'Schedule', path: '/coach/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Earnings', path: '/coach/earnings', icon: <DollarSign className="w-full h-full" /> },
];

function getWeekDates() {
  const today = new Date();
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    week.push(d);
  }
  return week;
}

function formatTime(time: string) {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function CoachSchedule() {
  const { currentUser } = useAuth();
  const { bookings } = useBookings();
  const { coaches } = useCoaches();

  const coachProfile = coaches.find(c =>
    c.userId === currentUser?.id || c.email === currentUser?.email
  );

  const coachBookings = coachProfile
    ? bookings.filter(b => b.coachId === coachProfile.id && (b.status === 'accepted' || b.status === 'pending'))
    : [];

  const weekDates = getWeekDates();

  const statusConfig = {
    pending: { label: 'Pending', variant: 'yellow' as const },
    accepted: { label: 'Confirmed', variant: 'green' as const },
    rejected: { label: 'Declined', variant: 'red' as const },
    completed: { label: 'Completed', variant: 'blue' as const },
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return coachBookings.filter(b => b.date === dateStr);
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Coach Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Schedule</h1>
          <p className="text-gray-500 mt-1">Your upcoming sessions for the next 7 days</p>
        </div>

        {/* Weekly Strip — horizontally scrollable so each day has room to
            actually show booking details, instead of squeezing 7 equal
            columns into a phone screen */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {weekDates.map((date, i) => {
            const dayBookings = getBookingsForDate(date);
            const isToday = i === 0;
            return (
              <div
                key={i}
                className={`flex-shrink-0 w-28 rounded-xl border p-2 min-h-24 ${isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="text-center mb-2">
                  <p className={`text-xs font-bold ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                    {date.toLocaleDateString('en-AE', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-black ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                    {date.getDate()}
                  </p>
                </div>
                {dayBookings.map(b => (
                  <div key={b.id} className={`text-xs p-1.5 rounded-lg mb-1 ${b.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    <p className="font-bold truncate">{b.parentName}</p>
                    <p className="truncate">{formatTime(b.time)}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Session List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
          {coachBookings.length === 0 ? (
            <Card className="text-center py-12">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">No upcoming sessions</h3>
              <p className="text-gray-500 text-sm">Sessions you accept will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {coachBookings
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(booking => {
                  const status = statusConfig[booking.status];
                  return (
                    <Card key={booking.id} className="flex items-center gap-4">
                      <div className={`flex-shrink-0 text-center px-4 py-3 rounded-xl ${booking.status === 'accepted' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <p className="text-xs font-bold text-gray-500">
                          {new Date(booking.date).toLocaleDateString('en-AE', { month: 'short' })}
                        </p>
                        <p className={`text-2xl font-black ${booking.status === 'accepted' ? 'text-green-700' : 'text-yellow-700'}`}>
                          {new Date(booking.date).getDate()}
                        </p>
                        <p className="text-xs font-bold text-gray-500">
                          {new Date(booking.date).toLocaleDateString('en-AE', { weekday: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-gray-900">{booking.parentName}</p>
                          <Badge variant={status.variant} size="sm">{status.label}</Badge>
                        </div>
                        <p className="text-sm text-blue-600 font-medium">{booking.sportType}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(booking.time)}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.location}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">AED {booking.coachEarnings}</p>
                        <p className="text-xs text-gray-400">Your earnings</p>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
