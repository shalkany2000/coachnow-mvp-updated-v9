import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'gm';
  const { notifications, unreadCount, markAllSeen } = useAdminNotifications();

  useOutsideClick(dropRef, () => setDropOpen(false), dropOpen);

  const toggleBell = () => {
    if (!bellOpen) markAllSeen();
    setBellOpen(!bellOpen);
  };

  const goToNotification = (link: string) => {
    navigate(link);
    setBellOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropOpen(false);
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'admin' || currentUser.role === 'gm') return '/admin';
    if (currentUser.role === 'coach') return '/coach/dashboard';
    return '/parent/home';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/images/logo-icon.png" alt="" className="w-9 h-9" />
            <span className="font-bold text-xl text-gray-900">
              Coach<span className="text-blue-600">Now</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/coaches" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Find Coaches
            </Link>
            <Link to="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              How it Works
            </Link>
            {!currentUser ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    open={bellOpen}
                    onToggle={toggleBell}
                    onClose={() => setBellOpen(false)}
                    onNavigate={goToNotification}
                  />
                )}

                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <button
                        onClick={() => { navigate(getDashboardPath()); setDropOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { navigate('/profile'); setDropOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-1">
            {isAdmin && (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                open={bellOpen}
                onToggle={toggleBell}
                onClose={() => setBellOpen(false)}
                onNavigate={goToNotification}
                size="sm"
              />
            )}
            <button
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link to="/coaches" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
            Find Coaches
          </Link>
          {currentUser ? (
            <>
              <Link to={getDashboardPath()} className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block w-full text-left text-sm font-medium text-red-600 py-2">
                Log Out
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => { navigate('/login'); setMenuOpen(false); }}>Log In</Button>
              <Button fullWidth onClick={() => { navigate('/register'); setMenuOpen(false); }}>Sign Up</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
