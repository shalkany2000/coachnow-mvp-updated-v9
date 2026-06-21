import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, mockUsers } from '../lib/mockData';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, role: 'parent' | 'coach') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('coachnow_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  // Keeps a directory of every account that has ever logged in or registered
  // in Firestore (not localStorage), so the Admin > Users page sees real
  // signups from every device, not just the admin's own browser. This is
  // fire-and-forget on purpose — a hiccup writing to the directory shouldn't
  // block someone from actually logging in and using the app.
  const saveToDirectory = (user: User) => {
    setDoc(doc(db, 'users', user.id), user).catch((err) => {
      console.error('Failed to record user in directory:', err);
    });
  };

  const login = async (email: string, _password: string) => {
    // Demo mode: match by email or create session
    let user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create a new parent user for any unknown email
      user = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        phone: '',
        role: 'parent',
        createdAt: new Date().toISOString(),
      };
    }

    // Special logins
    if (email === 'admin@coachnow.ae') {
      user = { ...user, role: 'admin' };
    } else if (email === 'ahmed@coach.com') {
      user = { ...user, role: 'coach' };
    }

    setCurrentUser(user);
    localStorage.setItem('coachnow_user', JSON.stringify(user));
    saveToDirectory(user);
  };

  const register = async (name: string, email: string, phone: string, _password: string, role: 'parent' | 'coach') => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    localStorage.setItem('coachnow_user', JSON.stringify(newUser));
    saveToDirectory(newUser);
    // Note: the actual Coach catalog entry (sport, price, location, etc.) is
    // created when the coach completes /coach/profile-setup — see
    // CoachContext.addCoach, which links back via userId === newUser.id.
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('coachnow_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
