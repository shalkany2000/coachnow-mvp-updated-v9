import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, LogOut, ArrowRight, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isMapLink } from '../lib/config';
import { Navbar } from '../components/layout/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const roleConfig = {
  parent: { label: 'Parent', variant: 'blue' as const, desc: 'Finding coaches for your family' },
  coach: { label: 'Coach', variant: 'green' as const, desc: 'Providing training sessions' },
  admin: { label: 'Administrator', variant: 'purple' as const, desc: 'Managing the platform' },
  gm: { label: 'General Manager', variant: 'yellow' as const, desc: 'Managing platform operations' },
};

export function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(currentUser?.homeAddress || '');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  useEffect(() => {
    setAddress(currentUser?.homeAddress || '');
  }, [currentUser?.homeAddress]);

  if (!currentUser) {
    return null;
  }

  const handleSaveAddress = async () => {
    setAddressError(''); setAddressSaved(false);
    setAddressLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { homeAddress: address.trim() });
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save address:', err);
      setAddressError("Couldn't save — check your connection and try again.");
    } finally {
      setAddressLoading(false);
    }
  };

  const rc = roleConfig[currentUser.role];

  const getDashboardPath = () => {
    if (currentUser.role === 'admin' || currentUser.role === 'gm') return '/admin';
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

          {currentUser.role === 'parent' && (
            <Card className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Home Address</h3>
              </div>
              <p className="text-xs text-gray-500">
                Saved here once, then pre-filled every time you book — so your coach always knows where to go.
                For the most accurate directions, open Google Maps, find your location, tap <strong>Share</strong>,
                then <strong>Copy link</strong> and paste it here. A typed address works too.
              </p>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Paste your Google Maps link, or type your address"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              />
              {isMapLink(address) && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Maps link detected — your coach will see your exact pin.
                </p>
              )}
              {addressError && (
                <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {addressError}
                </div>
              )}
              {addressSaved && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Saved.
                </div>
              )}
              <Button onClick={handleSaveAddress} loading={addressLoading} size="sm">
                Save Address
              </Button>
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-medium">CoachNow — Dubai's sports coaching marketplace 🇦🇪</p>
          </div>
        </div>

        <Button
          variant="danger"
          fullWidth
          onClick={async () => { await logout(); navigate('/'); }}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
