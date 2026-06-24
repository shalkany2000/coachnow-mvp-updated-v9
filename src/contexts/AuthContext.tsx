import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, mockUsers } from '../lib/mockData';
import { generateReferralCode } from '../lib/referral';
import { findReferrerByCode, createReferralRecord } from '../lib/referralActions';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string, role: 'parent' | 'coach', referralCodeInput?: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// The 3 demo accounts (Parent/Coach/Admin Demo buttons on the login page)
// are created directly in the Firebase console as real Auth accounts, but
// that doesn't automatically create a matching Firestore profile document.
// This fills one in on first-ever login, using the same email -> role
// mapping the app always used for these specific demo addresses.
function defaultRoleForEmail(email: string): 'parent' | 'coach' | 'admin' {
  if (email === 'admin@coachnow.ae') return 'admin';
  if (email === 'ahmed@coach.com') return 'coach';
  return 'parent';
}

async function loadOrCreateProfile(firebaseUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as User;
  }
  const fallbackName =
    mockUsers.find(u => u.email.toLowerCase() === (firebaseUser.email || '').toLowerCase())?.name ||
    firebaseUser.email?.split('@')[0] ||
    'New User';
  const profile: User = {
    id: firebaseUser.uid,
    name: fallbackName,
    email: firebaseUser.email || '',
    phone: '',
    role: defaultRoleForEmail(firebaseUser.email || ''),
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, profile);
  return profile;
}

// Maps Firebase's technical error codes to messages a non-technical person
// can actually act on.
export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists — try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address doesn\'t look right.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await loadOrCreateProfile(firebaseUser);
          setCurrentUser(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadOrCreateProfile(credential.user);
    setCurrentUser(profile);
    return profile;
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: 'parent' | 'coach',
    referralCodeInput?: string
  ): Promise<User> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const profile: User = {
      id: credential.user.uid,
      name,
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
      referralCode: generateReferralCode(name),
    };
    await setDoc(doc(db, 'users', credential.user.uid), profile);
    setCurrentUser(profile);

    // Linking a referral is best-effort and never blocks registration —
    // a typo'd or expired code just means no referral gets recorded,
    // not a failed signup.
    if (referralCodeInput && referralCodeInput.trim()) {
      try {
        const referrer = await findReferrerByCode(referralCodeInput);
        if (referrer && referrer.id !== profile.id) {
          await setDoc(doc(db, 'users', profile.id), { referredBy: referrer.id }, { merge: true });
          await createReferralRecord(referrer.id, referrer.name, profile.id, profile.name);
        }
      } catch (err) {
        console.error('Failed to link referral:', err);
      }
    }

    // Note: the actual Coach catalog entry (sport, price, location, etc.) is
    // created when the coach completes /coach/profile-setup — see
    // CoachContext.addCoach, which links back via userId === newUser.id.
    return profile;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
