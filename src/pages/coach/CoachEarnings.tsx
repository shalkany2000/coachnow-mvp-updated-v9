import { LayoutDashboard, User, BookOpen, Calendar, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';

const sidebarItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'My Profile', path: '/coach/profile-setup', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/coach/bookings', icon: <BookOpen className="w-full h-full" /> },
  { label: 'Schedule', path: '/coach/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Earnings', path: '/coach/earnings', icon: <DollarSign className="w-full h-full" /> },
];

export function CoachEarnings() {
  const { currentUser } = useAuth();
  const { bookings } = useBookings();
  const { coaches } = useCoaches();
  const { settings } = useSettings();
  const commissionPercent = Math.round(settings.commissionRate * 100);

  const coachProfile = coaches.find(c =>
    c.userId === currentUser?.id || c.email === currentUser?.email
  );

  const coachBookings = coachProfile ? bookings.filter(b => b.coachId === coachProfile.id) : [];
  const completed = coachBookings.filter(b => b.status === 'completed');
  const accepted = coachBookings.filter(b => b.status === 'accepted');
  const pending = coachBookings.filter(b => b.status === 'pending');

  const totalEarned = completed.reduce((s, b) => s + b.coachEarnings, 0);
  const totalCommission = completed.reduce((s, b) => s + b.commission, 0);
  const totalRevenue = completed.reduce((s, b) => s + b.price, 0);
  const pendingEarnings = accepted.reduce((s, b) => s + b.coachEarnings, 0);
  const potentialEarnings = pending.reduce((s, b) => s + b.coachEarnings, 0);

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Academy Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Earnings</h1>
          <p className="text-gray-500 mt-1">Track your income and commissions</p>
        </div>

        {/* Main Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-semibold text-emerald-100">Total Earned</span>
            </div>
            <p className="text-3xl font-black">AED {totalEarned}</p>
            <p className="text-emerald-100 text-sm mt-1">From {completed.length} sessions</p>
          </Card>
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-600">Upcoming</span>
            </div>
            <p className="text-3xl font-black text-gray-900">AED {pendingEarnings}</p>
            <p className="text-gray-400 text-sm mt-1">From {accepted.length} confirmed</p>
          </Card>
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-600">Potential</span>
            </div>
            <p className="text-3xl font-black text-gray-900">AED {potentialEarnings}</p>
            <p className="text-gray-400 text-sm mt-1">From {pending.length} pending</p>
          </Card>
        </div>

        {/* Commission Breakdown */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Commission Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">Total Session Revenue</p>
                <p className="text-sm text-gray-500">Gross amount from all completed sessions</p>
              </div>
              <p className="text-xl font-black text-gray-900 flex-shrink-0 whitespace-nowrap ml-3">AED {totalRevenue}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="min-w-0">
                <p className="font-semibold text-red-800">Platform Commission ({commissionPercent}%)</p>
                <p className="text-sm text-red-600">CoachNow service fee</p>
              </div>
              <p className="text-xl font-black text-red-700 flex-shrink-0 whitespace-nowrap ml-3">- AED {totalCommission}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
              <div className="min-w-0">
                <p className="font-bold text-emerald-800 text-lg">Your Net Earnings ({100 - commissionPercent}%)</p>
                <p className="text-sm text-emerald-600">Amount you take home</p>
              </div>
              <p className="text-2xl font-black text-emerald-700 flex-shrink-0 whitespace-nowrap ml-3">AED {totalEarned}</p>
            </div>
          </div>
        </Card>

        {/* Commission Info */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">How earnings work</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• CoachNow takes a <strong>{commissionPercent}% platform fee</strong> on each completed session</p>
                <p>• You keep <strong>{100 - commissionPercent}% of your session price</strong></p>
                <p>• Payment is collected online — clients pay via a secure link sent over WhatsApp</p>
                <p>• Platform fee is deducted from your monthly settlement</p>
                <p>• Payouts are processed weekly via bank transfer</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Transaction History</h2>
          {completed.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No completed sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile: stacked cards */}
              <div className="sm:hidden space-y-2">
                {completed.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{booking.parentName}</p>
                      <p className="text-xs text-gray-500">{new Date(booking.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm text-gray-600">AED {booking.price}</p>
                      <p className="text-sm font-bold text-emerald-600">+AED {booking.coachEarnings}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: aligned grid */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-4 gap-3 text-xs font-semibold text-gray-400 px-3 pb-2 border-b border-gray-100">
                  <span>Date</span>
                  <span>Client</span>
                  <span className="text-right">Session</span>
                  <span className="text-right">Your Cut</span>
                </div>
                {completed.map(booking => (
                  <div key={booking.id} className="grid grid-cols-4 gap-3 text-sm items-center px-3 py-2 hover:bg-gray-50 rounded-xl">
                    <span className="text-gray-500">{new Date(booking.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</span>
                    <span className="font-medium text-gray-800 truncate">{booking.parentName}</span>
                    <span className="text-right text-gray-600">AED {booking.price}</span>
                    <span className="text-right font-bold text-emerald-600">AED {booking.coachEarnings}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
