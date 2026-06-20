import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, User, BookOpen, TrendingUp, DollarSign, ChevronRight, Activity } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { mockUsers } from '../../lib/mockData';

const sidebarItems = [
  { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Coaches', path: '/admin/coaches', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/admin/bookings', icon: <BookOpen className="w-full h-full" /> },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { bookings } = useBookings();
  const { coaches } = useCoaches();

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.price, 0);
  const totalCommission = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.commission, 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const statusConfig = {
    pending: { label: 'Pending', variant: 'yellow' as const },
    accepted: { label: 'Accepted', variant: 'green' as const },
    rejected: { label: 'Rejected', variant: 'red' as const },
    completed: { label: 'Completed', variant: 'blue' as const },
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Admin Panel">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Admin Overview</h1>
            <p className="text-gray-500 mt-1">Platform performance at a glance</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
            <Activity className="w-4 h-4" />
            Platform Live
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: mockUsers.length + coaches.length, icon: <Users className="w-5 h-5" />, color: 'blue', sub: 'registered accounts' },
            { label: 'Total Coaches', value: coaches.length, icon: <User className="w-5 h-5" />, color: 'purple', sub: `${coaches.filter(c => c.verified).length} verified` },
            { label: 'Total Bookings', value: bookings.length, icon: <BookOpen className="w-5 h-5" />, color: 'green', sub: `${pendingBookings} pending` },
            { label: 'Commission Earned', value: `AED ${totalCommission}`, icon: <DollarSign className="w-5 h-5" />, color: 'yellow', sub: '15% per booking' },
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
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </Card>
          ))}
        </div>

        {/* Revenue Overview */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="font-bold">Revenue Overview</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">Total GMV</span>
                <span className="font-black text-lg">AED {totalRevenue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">Platform Revenue</span>
                <span className="font-black text-lg">AED {totalCommission}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">Coach Payouts</span>
                <span className="font-black text-lg">AED {totalRevenue - totalCommission}</span>
              </div>
              <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                <span className="text-blue-100 text-sm">Completed sessions</span>
                <span className="font-bold">{completedBookings}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-gray-900 mb-4">Booking Status Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Pending', count: bookings.filter(b => b.status === 'pending').length, color: 'bg-yellow-400' },
                { label: 'Accepted', count: bookings.filter(b => b.status === 'accepted').length, color: 'bg-green-400' },
                { label: 'Completed', count: bookings.filter(b => b.status === 'completed').length, color: 'bg-blue-400' },
                { label: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length, color: 'bg-red-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: bookings.length > 0 ? `${(item.count / bookings.length) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="font-bold text-sm text-gray-800 w-6 text-right">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Bookings</h2>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No bookings yet</p>
            </div>
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <div className="sm:hidden space-y-3">
                {recentBookings.map(booking => {
                  const sc = statusConfig[booking.status];
                  return (
                    <div key={booking.id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{booking.parentName}</p>
                          <p className="text-xs text-gray-500">with {booking.coachName} · {booking.sportType}</p>
                        </div>
                        <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(booking.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</span>
                        <span className="font-semibold text-gray-900">AED {booking.price}</span>
                        <span className="font-semibold text-emerald-600">+AED {booking.commission}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-3 text-xs font-semibold text-gray-400">Parent</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400">Coach</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400">Sport</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400">Date</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 text-right">Price</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400 text-right">Commission</th>
                      <th className="pb-3 text-xs font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentBookings.map(booking => {
                      const sc = statusConfig[booking.status];
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900">{booking.parentName}</td>
                          <td className="py-3 text-gray-600">{booking.coachName}</td>
                          <td className="py-3 text-gray-600">{booking.sportType}</td>
                          <td className="py-3 text-gray-500">{new Date(booking.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</td>
                          <td className="py-3 text-right font-semibold text-gray-900">AED {booking.price}</td>
                          <td className="py-3 text-right font-semibold text-emerald-600">AED {booking.commission}</td>
                          <td className="py-3">
                            <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
