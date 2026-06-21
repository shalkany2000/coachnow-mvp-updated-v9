import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Dumbbell, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth, friendlyAuthError } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const DEMO_ACCOUNTS = [
  { label: '👨‍👩‍👧 Parent Demo', email: 'parent@demo.com', password: 'demo123' },
  { label: '🏊 Coach Demo', email: 'ahmed@coach.com', password: 'demo123' },
  { label: '⚙️ Admin Demo', email: 'admin@coachnow.ae', password: 'demo123' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'coach') navigate('/coach/dashboard');
      else navigate('/parent/home');
    } catch (err) {
      console.error('Login failed:', err);
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail); setPassword(demoPass);
    setLoading(true); setError('');
    try {
      const user = await login(demoEmail, demoPass);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'coach') navigate('/coach/dashboard');
      else navigate('/parent/home');
    } catch (err) {
      console.error('Demo login failed:', err);
      setError(
        "Demo login failed — this demo account may not be set up in Firebase yet. " +
        friendlyAuthError(err)
      );
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
          <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Demo Accounts */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">🚀 Quick Demo Access</p>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => handleDemoLogin(acc.email, acc.password)}
                className="flex items-center justify-between w-full text-left px-3 py-2 bg-white hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-700 transition-colors border border-blue-100 group"
              >
                <span>{acc.label}</span>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
                {error}
              </div>
            )}
            {notice && (
              <div className="bg-blue-50 text-blue-700 text-sm rounded-xl px-4 py-3 border border-blue-100">
                {notice}
              </div>
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => setNotice("Password reset isn't available in this demo — try one of the demo accounts above instead.")}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
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
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
