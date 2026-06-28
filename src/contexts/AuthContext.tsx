import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
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
  register: (name: string, email: string, phone: string, password: string, role: 'parent' | 'coach', referralCodeInput?: string, termsAccepted?: boolean) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  completeProfile: (phone: string, role: 'parent' | 'coach', referralCodeInput?: string, termsAccepted?: boolean) => Promise<User>;
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

function isKnownDemoEmail(email: string): boolean {
  return mockUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
}

// Single place that creates a Firestore profile for ANY auth account that
// doesn't have one yet — whether that's the result of a normal
// email/password registration's first onAuthStateChanged firing, a demo
// account's first-ever login, or (the new case) a brand new Google
// sign-in. Consolidating this into one function avoids a race between
// the auth listener and a separate Google-specific creation path each
// trying to create the profile differently.
async function loadOrCreateProfile(firebaseUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as User;
  }
  const email = firebaseUser.email || '';
  const knownDemo = isKnownDemoEmail(email);
  const fallbackName =
    mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())?.name ||
    firebaseUser.displayName ||
    email.split('@')[0] ||
    'New User';
  const profile: User = {
    id: firebaseUser.uid,
    name: fallbackName,
    email,
    phone: '',
    role: defaultRoleForEmail(email),
    createdAt: new Date().toISOString(),
    // Known demo accounts keep their existing behavior exactly as before
    // (usable immediately). Any genuinely new account — which today only
    // happens via Google sign-in, since email/password registration
    // always collects phone + role before ever reaching this function —
    // is explicitly marked incomplete until they provide both.
    ...(knownDemo ? {} : { profileComplete: false, referralCode: generateReferralCode(fallbackName) }),
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
    case 'auth/operation-not-allowed':
      return 'Google sign-in isn\'t turned on yet for this app — an admin needs to enable it in Firebase Console under Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This website isn\'t yet authorized for Google sign-in — an admin needs to add this domain in Firebase Console under Authentication > Settings > Authorized domains.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled before it finished.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup — please allow popups for this site and try again.';
    default:
      return `Something went wrong. Please try again. (${code || 'unknown error'})`;
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

  // signInWithRedirect was tried first, but it relies on cross-domain
  // storage access between this app's domain and the authDomain
  // (coachnow-725fb.firebaseapp.com) — Firebase's own documentation
  // confirms this silently fails (no error, no result) on browsers that
  // block third-party storage access, which is increasingly common on
  // mobile. signInWithPopup avoids that entirely: the result (or any
  // error) comes back directly from this same function call, in the same
  // tab, with no cross-domain redirect involved.
  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    // Load/create the profile directly here, the same way login() and
    // register() already do — rather than relying on the separate
    // onAuthStateChanged listener to eventually catch up. This matters
    // because the calling code (the Google button) needs to know the
    // actual result immediately, to decide whether to navigate a
    // returning user straight to their dashboard. Without this, a
    // returning user with an already-complete profile would sign in
    // successfully in the background with nothing ever taking them
    // anywhere — exactly the bug that was happening.
    const profile = await loadOrCreateProfile(credential.user);
    setCurrentUser(profile);
    return profile;
  };

  // Fills in what Google sign-in can't provide on its own — a phone
  // number (essential, since the whole booking flow runs through
  // WhatsApp) and whether they're a parent or a coach. Until this runs,
  // the account exists in Firebase Auth but profileComplete stays false,
  // and the rest of the app treats that as "not really signed in yet."
  const completeProfile = async (
    phone: string,
    role: 'parent' | 'coach',
    referralCodeInput?: string,
    termsAccepted?: boolean
  ): Promise<User> => {
    if (!currentUser) throw new Error('No signed-in account to complete a profile for.');
    const updated: User = {
      ...currentUser,
      phone,
      role,
      profileComplete: true,
      ...(role === 'coach' && termsAccepted ? { termsAcceptedAt: new Date().toISOString() } : {}),
    };
    await setDoc(doc(db, 'users', currentUser.id), updated);
    setCurrentUser(updated);

    if (referralCodeInput && referralCodeInput.trim()) {
      try {
        const referrer = await findReferrerByCode(referralCodeInput);
        if (referrer && referrer.id !== updated.id) {
          await setDoc(doc(db, 'users', updated.id), { referredBy: referrer.id }, { merge: true });
          await createReferralRecord(referrer.id, referrer.name, updated.id, updated.name);
        }
      } catch (err) {
        console.error('Failed to link referral:', err);
      }
    }

    return updated;
  };

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
    referralCodeInput?: string,
    termsAccepted?: boolean
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
      // Only academies/coaches see and must check this box — recorded as
      // a real timestamp, not just a boolean, so there's an actual record
      // of when they agreed if it's ever needed later.
      ...(role === 'coach' && termsAccepted ? { termsAcceptedAt: new Date().toISOString() } : {}),
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
    <AuthContext.Provider value={{ currentUser, login, register, signInWithGoogle, completeProfile, logout, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
