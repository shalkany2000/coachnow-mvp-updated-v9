import { LayoutDashboard, Users, User, BookOpen, Search, Mail, Phone, Calendar } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { mockUsers, User as UserType } from '../../lib/mockData';
import { useState } from 'react';

const sidebarItems = [
  { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Coaches', path: '/admin/coaches', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/admin/bookings', icon: <BookOpen className="w-full h-full" /> },
];

const roleConfig = {
  parent: { label: 'Parent', variant: 'blue' as const },
  coach: { label: 'Coach', variant: 'green' as const },
  admin: { label: 'Admin', variant: 'purple' as const },
};

export function AdminUsers() {
  const { coaches } = useCoaches();
  const [search, setSearch] = useState('');

  // Real accounts that have logged in or registered, live from Firestore —
  // see AuthContext.saveToDirectory — so this reflects signups from every
  // device, not just whichever browser the admin happens to be using.
  const { data: registeredUsers } = useFirestoreCollection<UserType>('users');

  // Combine mock users + real registered users + coach users derived from the coach catalog
  const coachUsers = coaches.map(c => ({
    id: c.userId,
    name: c.name,
    email: c.email,
    phone: '', // coaches don't currently submit a phone separately from their account
    role: 'coach' as const,
    createdAt: '2025-06-15T00:00:00Z',
  }));

  const merged = [...mockUsers, ...registeredUsers, ...coachUsers];
  const allUsers = merged.filter((u, i) =>
    merged.findIndex(other => other.email.toLowerCase() === u.email.toLowerCase()) === i
  );

  const filtered = allUsers.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  const parents = allUsers.filter(u => u.role === 'parent').length;
  const coachCount = allUsers.filter(u => u.role === 'coach').length;

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Admin Panel">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">{allUsers.length} registered users · {parents} parents · {coachCount} coaches</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: allUsers.length, color: 'blue' },
            { label: 'Parents', value: parents, color: 'green' },
            { label: 'Coaches', value: coachCount, color: 'purple' },
          ].map(stat => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className={`text-2xl font-black ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : 'text-purple-600'}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Users — card list on mobile, table on desktop */}
        {filtered.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users match that search</p>
          </Card>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map(user => {
                const rc = roleConfig[user.role];
                return (
                  <Card key={user.id} padding="sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">{user.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                        <Badge variant={rc.variant} size="sm">{rc.label}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{user.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Desktop: table */}
            <Card padding="none" className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400">Phone</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(user => {
                      const rc = roleConfig[user.role];
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-blue-600">{user.name.charAt(0)}</span>
                              </div>
                              <span className="font-medium text-gray-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {user.phone || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={rc.variant} size="sm">{rc.label}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(user.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
