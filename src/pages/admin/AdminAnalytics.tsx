import { TrendingUp, Users, RotateCcw, XCircle, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useBookings } from '../../contexts/BookingContext';
import { useCoaches } from '../../contexts/CoachContext';
import { useAdminSidebarItems } from '../../hooks/useAdminSidebarItems';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';

const SPORT_COLORS: Record<string, string> = {
  Swimming: '#3b82f6', Football: '#10b981', Gym: '#ef4444', Tennis: '#a855f7', Basketball: '#f59e0b', Padel: '#94a3b8',
};

export function AdminAnalytics() {
  const { items: sidebarItems, title: sidebarTitle } = useAdminSidebarItems();
  const { bookings } = useBookings();
  const { coaches } = useCoaches();

  // Repeat booking rate — the single best signal of whether people who
  // try this actually come back, which matters more than raw signups.
  const parentBookingCounts = new Map<string, number>();
  bookings.forEach((b) => parentBookingCounts.set(b.parentId, (parentBookingCounts.get(b.parentId) || 0) + 1));
  const totalUniqueParents = parentBookingCounts.size;
  const repeatParents = [...parentBookingCounts.values()].filter((c) => c > 1).length;
  const repeatRate = totalUniqueParents > 0 ? Math.round((repeatParents / totalUniqueParents) * 100) : 0;

  // Funnel
  const totalBookings = bookings.length;
  const acceptedCount = bookings.filter((b) => b.status === 'accepted' || b.status === 'completed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;

  // Revenue & order value
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const totalRevenue = completedBookings.reduce((s, b) => s + b.price, 0);
  const avgOrderValue = completedBookings.length > 0 ? Math.round(totalRevenue / completedBookings.length) : 0;

  // Coach utilization — who's actually getting booked vs. sitting idle
  const coachStats = coaches
    .map((c) => ({
      name: c.name,
      bookings: bookings.filter((b) => b.coachId === c.id).length,
      revenue: bookings.filter((b) => b.coachId === c.id && b.status === 'completed').reduce((s, b) => s + b.coachEarnings, 0),
    }))
    .filter((c) => c.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8);

  // Sport popularity
  const sportCounts: Record<string, number> = {};
  bookings.forEach((b) => { sportCounts[b.sportType] = (sportCounts[b.sportType] || 0) + 1; });
  const sportData = Object.entries(sportCounts).map(([name, value]) => ({ name, value }));

  // Revenue trend by month
  const revenueByMonth: Record<string, number> = {};
  completedBookings.forEach((b) => {
    const month = b.date.slice(0, 7);
    revenueByMonth[month] = (revenueByMonth[month] || 0) + b.price;
  });
  const monthData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-AE', { month: 'short', year: '2-digit' }),
      revenue,
    }));

  const statCards = [
    { label: 'Repeat Booking Rate', value: `${repeatRate}%`, sub: `${repeatParents} of ${totalUniqueParents} customers came back`, icon: <RotateCcw className="w-5 h-5" />, color: 'blue' },
    { label: 'Avg. Order Value', value: `AED ${avgOrderValue}`, sub: `across ${completedBookings.length} completed sessions`, icon: <TrendingUp className="w-5 h-5" />, color: 'green' },
    { label: 'Cancellation Rate', value: `${cancellationRate}%`, sub: `${cancelledCount} of ${totalBookings} bookings`, icon: <XCircle className="w-5 h-5" />, color: 'red' },
    { label: 'Unique Customers', value: totalUniqueParents, sub: `${acceptedCount} bookings confirmed total`, icon: <Users className="w-5 h-5" />, color: 'purple' },
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle={sidebarTitle}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Real insight from your actual data — no extra setup needed.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                s.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                s.color === 'green' ? 'bg-emerald-50 text-emerald-600' :
                s.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'
              }`}>
                {s.icon}
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Booking funnel */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Booking Funnel</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Requested', value: totalBookings, color: 'bg-gray-100 text-gray-700' },
              { label: 'Confirmed', value: acceptedCount, color: 'bg-blue-50 text-blue-700' },
              { label: 'Completed', value: completedCount, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Declined', value: rejectedCount, color: 'bg-red-50 text-red-700' },
            ].map((f) => (
              <div key={f.label} className={`rounded-xl p-4 text-center ${f.color}`}>
                <p className="text-2xl font-black">{f.value}</p>
                <p className="text-xs font-semibold mt-0.5">{f.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue trend */}
        {monthData.length > 0 && (
          <Card>
            <h2 className="font-bold text-gray-900 mb-4">Revenue by Month</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`AED ${v}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sport popularity */}
          {sportData.length > 0 && (
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Bookings by Sport</h2>
              <div className="h-56 flex items-center">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={sportData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {sportData.map((entry) => (
                        <Cell key={entry.name} fill={SPORT_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {sportData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SPORT_COLORS[s.name] || '#94a3b8' }} />
                      <span className="text-gray-700">{s.name}</span>
                      <span className="text-gray-400 ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Coach utilization */}
          <Card>
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Most Booked Academies
            </h2>
            {coachStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {coachStats.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{c.bookings} bookings</p>
                      <p className="text-xs text-gray-400">AED {c.revenue} earned</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
