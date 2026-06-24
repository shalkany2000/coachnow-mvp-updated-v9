import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Dumbbell, Eye, EyeOff, Users, Phone, Gift } from 'lucide-react';
import { useAuth, friendlyAuthError } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [role, setRole] = useState<'parent' | 'coach'>('parent');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) { setError('Please fill in all fields.'); return; }
    if (phone.replace(/\D/g, '').length < 8) { setError('Please enter a valid phone number.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await register(name, email, phone, password, role, referralCode);
      if (role === 'coach') navigate('/coach/profile-setup');
      else navigate('/parent/home');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">Coach<span className="text-blue-600">Now</span></span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join CoachNow today — it's free</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('parent')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'parent'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Users className="w-6 h-6" />
              <div>
                <p className="font-bold text-sm">Parent</p>
                <p className="text-xs opacity-70">Find coaches</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('coach')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'coach'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Dumbbell className="w-6 h-6" />
              <div>
                <p className="font-bold text-sm">Coach</p>
                <p className="text-xs opacity-70">Offer sessions</p>
              </div>
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
                {error}
              </div>
            )}
            <Input
              label="Full Name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 0501234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />
            {role === 'parent' && (
              <Input
                label="Referral Code (optional)"
                type="text"
                placeholder="e.g. SARA42K"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                icon={<Gift className="w-4 h-4" />}
              />
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {role === 'coach' && (
              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                <p className="text-xs text-yellow-800 font-medium">
                  🎯 After registering, you'll set up your coach profile with your sport, pricing and availability.
                </p>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {role === 'parent' ? 'Find a Coach' : 'Start Coaching'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
