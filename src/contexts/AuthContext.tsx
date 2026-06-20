import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Keeps a directory of every account that has ever logged in or registered,
  // so the Admin > Users page can show real signups instead of only the
  // 3 hardcoded demo accounts.
  const saveToDirectory = (user: User) => {
    const stored = localStorage.getItem('coachnow_users_directory');
    const directory: User[] = stored ? JSON.parse(stored) : [];
    const next = [...directory.filter(u => u.email.toLowerCase() !== user.email.toLowerCase()), user];
    localStorage.setItem('coachnow_users_directory', JSON.stringify(next));
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
