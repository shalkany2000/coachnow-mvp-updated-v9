import { LayoutDashboard, Users, User, BookOpen, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function useAdminSidebarItems() {
  const { currentUser } = useAuth();
  const items = [
    { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-full h-full" /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-full h-full" /> },
    { label: 'Users', path: '/admin/users', icon: <Users className="w-full h-full" /> },
    { label: 'Coaches', path: '/admin/coaches', icon: <User className="w-full h-full" /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <BookOpen className="w-full h-full" /> },
  ];
  // Settings (commission rate, etc.) is for the actual admin only — a GM
  // has access to everything else above, but not platform-level settings.
  if (currentUser?.role === 'admin') {
    items.push({ label: 'Settings', path: '/admin/settings', icon: <Settings className="w-full h-full" /> });
  }
  const title = currentUser?.role === 'gm' ? 'GM Panel' : 'Admin Panel';
  return { items, title };
}
