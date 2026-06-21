import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, User, BookOpen, Search, Star, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const sidebarItems = [
  { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Coaches', path: '/admin/coaches', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/admin/bookings', icon: <BookOpen className="w-full h-full" /> },
];

const sportColors: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  Swimming: 'blue', Fitness: 'green', Tennis: 'purple', Padel: 'yellow', Badminton: 'red',
};

export function AdminCoaches() {
  const navigate = useNavigate();
  const { coaches, updateCoach } = useCoaches();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');

  const toggleVerified = async (id: string, verified: boolean) => {
    setActionError('');
    try {
      await updateCoach(id, { verified });
    } catch (err) {
      console.error('Failed to update coach verification:', err);
      setActionError("Couldn't update that coach — check your connection and try again.");
    }
  };

  const filtered = coaches.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sportType.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  const verified = coaches.filter(c => c.verified).length;

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Admin Panel">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coaches</h1>
          <p className="text-gray-500 mt-1">{coaches.length} total coaches · {verified} verified</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Coaches', value: coaches.length, color: 'blue' },
            { label: 'Verified', value: verified, color: 'green' },
            { label: 'Pending Verification', value: coaches.length - verified, color: 'yellow' },
          ].map(stat => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className={`text-2xl font-black ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900"
            placeholder="Search coaches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {actionError}
          </div>
        )}

        {/* Coach Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(coach => (
            <Card key={coach.id}>
              <div className="flex items-start gap-4">
                <img
                  src={coach.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=60`}
                  alt={coach.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=60`; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{coach.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant={sportColors[coach.sportType] || 'gray'} size="sm">{coach.sportType}</Badge>
                        {coach.verified
                          ? <Badge variant="green" size="sm">✓ Verified</Badge>
                          : <Badge variant="yellow" size="sm">Pending</Badge>
                        }
                        {coach.onLeave && <Badge variant="yellow" size="sm">🌴 On Leave</Badge>}
                      </div>
                    </div>
                    <span className="font-bold text-blue-600 text-sm flex-shrink-0">AED {coach.pricePerHour}/session</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{coach.rating} ({coach.reviewCount})</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{coach.location}</span>
                  </div>
                </div>
              </div>
              {/* Admin Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                {!coach.verified ? (
                  <button
                    onClick={() => toggleVerified(coach.id, true)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verify Coach
                  </button>
                ) : (
                  <button
                    onClick={() => toggleVerified(coach.id, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => navigate(`/coaches/${coach.id}`)}
                  className="flex-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 py-2 rounded-lg transition-colors"
                >
                  View Profile
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
