import { useAuth, friendlyAuthError } from '../contexts/AuthContext';
import { useState } from 'react';

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // A popup, not a redirect — this resolves directly once the user
      // picks an account, no page reload involved. onAuthStateChanged in
      // AuthContext picks up the result from here.
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5Z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16.2 3 9.4 7.3 6.3 14.7Z" />
          <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.4 26.7 37 24 37c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5C9.4 41.6 16.1 45 24 45Z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 35.9 44 30.7 44 24c0-1.2-.1-2.4-.4-3.5Z" />
        </svg>
        {loading ? 'Opening Google sign-in...' : 'Continue with Google'}
      </button>
      {error && <p className="text-xs text-red-600 font-medium mt-2 text-center">{error}</p>}
    </div>
  );
}
