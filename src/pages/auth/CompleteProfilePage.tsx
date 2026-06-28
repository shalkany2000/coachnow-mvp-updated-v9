import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Users, Dumbbell, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { currentUser, completeProfile, logout } = useAuth();
  const [role, setRole] = useState<'parent' | 'coach'>('parent');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (role === 'coach' && !termsAccepted) {
      setError('Please read and accept the Academy & Gym Partner Terms to continue.');
      return;
    }
    setLoading(true); setError('');
    try {
      await completeProfile(phone, role, referralCode, termsAccepted);
      navigate(role === 'coach' ? '/coach/profile-setup' : '/parent/home');
    } catch (err) {
      console.error('Failed to complete profile:', err);
      setError("Couldn't save your details — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">Coach<span className="text-blue-600">Now</span></span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Almost there, {currentUser?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Just two quick things before you start</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role Selector */}
          <p className="text-sm font-medium text-gray-700 mb-2">I'm here to...</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('parent')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'parent' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Users className="w-6 h-6" />
              <div>
                <p className="font-bold text-sm">Find Academies</p>
                <p className="text-xs opacity-70">I'm a parent</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('coach')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'coach' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Dumbbell className="w-6 h-6" />
              <div>
                <p className="font-bold text-sm">List My Academy</p>
                <p className="text-xs opacity-70">I run an academy</p>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
                {error}
              </div>
            )}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 0501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />
            <p className="text-xs text-gray-400 -mt-3">
              Required — this is how {role === 'parent' ? 'your academy' : 'parents'} reach you on WhatsApp.
            </p>
            {role === 'parent' && (
              <Input
                label="Referral Code (optional)"
                type="text"
                placeholder="e.g. SARA42K"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                icon={<Gift className="w-4 h-4" />}
              />
            )}
            {role === 'coach' && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600">
                  I've read and agree to the{' '}
                  <Link to="/academy-terms" target="_blank" className="text-blue-600 font-semibold hover:underline">
                    Academy & Gym Partner Terms
                  </Link>
                </span>
              </label>
            )}
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Continue
            </Button>
          </form>

          <button
            onClick={() => logout()}
            className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-5"
          >
            Not you? Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
