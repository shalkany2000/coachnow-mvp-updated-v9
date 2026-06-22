import { useState } from 'react';
import { BookOpen, Search, DollarSign } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { BookingCard } from '../../components/bookings/BookingCard';
import { useAdminSidebarItems } from '../../hooks/useAdminSidebarItems';

const TABS = ['All', 'Pending', 'Accepted', 'Completed', 'Rejected'];

export function AdminBookings() {
  const { items: sidebarItems, title: sidebarTitle } = useAdminSidebarItems();
  const { bookings, markBookingPaid } = useBookings();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');

  const handleMarkPaid = async (id: string) => {
    setActionError('');
    try {
      await markBookingPaid(id);
    } catch (err) {
      console.error('Failed to mark booking as paid:', err);
      setActionError("Couldn't update that booking — check your connection and try again.");
    }
  };

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'All' || b.status === activeTab.toLowerCase();
    const matchSearch = !search ||
      b.parentName.toLowerCase().includes(search.toLowerCase()) ||
      b.coachName.toLowerCase().includes(search.toLowerCase()) ||
      b.sportType.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalCommission = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.commission, 0);

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle={sidebarTitle}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">All Bookings</h1>
            <p className="text-gray-500 mt-1">{bookings.length} total bookings on platform</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold">
            <DollarSign className="w-4 h-4" />
            Commission: AED {totalCommission}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => {
            const count = tab === 'All' ? bookings.length : bookings.filter(b => b.status === tab.toLowerCase()).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900"
            placeholder="Search by parent, coach, or sport..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Revenue', value: `AED ${bookings.filter(b => b.status === 'completed').reduce((s,b) => s+b.price, 0)}`, color: 'gray' },
            { label: 'Platform Commission', value: `AED ${totalCommission}`, color: 'green' },
            { label: 'Coach Payouts', value: `AED ${bookings.filter(b => b.status === 'completed').reduce((s,b) => s+b.coachEarnings, 0)}`, color: 'blue' },
            { label: 'Pending Value', value: `AED ${bookings.filter(b => b.status === 'pending').reduce((s,b) => s+b.price, 0)}`, color: 'yellow' },
          ].map(stat => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className="text-sm font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {actionError}
          </div>
        )}

        {/* Bookings */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role="admin"
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
