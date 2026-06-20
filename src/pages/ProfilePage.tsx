import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const roleConfig = {
  parent: { label: 'Parent', variant: 'blue' as const, desc: 'Finding coaches for your family' },
  coach: { label: 'Coach', variant: 'green' as const, desc: 'Providing training sessions' },
  admin: { label: 'Administrator', variant: 'purple' as const, desc: 'Managing the platform' },
};

export function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const rc = roleConfig[currentUser.role];

  const getDashboardPath = () => {
    if (currentUser.role === 'admin') return '/admin';
    if (currentUser.role === 'coach') return '/coach/dashboard';
    return '/parent/home';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-black text-gray-900 mb-6">My Account</h1>

        <Card className="mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-3xl font-black text-blue-600">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900">{currentUser.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={rc.variant}>{rc.label}</Badge>
                <span className="text-xs text-gray-400">{rc.desc}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-3 mb-6">
          <Card hover onClick={() => navigate(getDashboardPath())} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">My Dashboard</p>
                <p className="text-xs text-gray-500">Go to your dashboard</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Card>

          <Card className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{currentUser.email}</span>
              </div>
              {currentUser.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{currentUser.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 capitalize">{currentUser.role} Account</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Joined {new Date(currentUser.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </Card>

          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
            <p className="text-sm text-yellow-800 font-medium mb-1">🚀 Demo Mode</p>
            <p className="text-xs text-yellow-700">
              This is a demo version of CoachNow. All data is stored locally in your browser.
              In production, real Firebase authentication and Firestore would be used.
            </p>
          </div>
        </div>

        <Button
          variant="danger"
          fullWidth
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
