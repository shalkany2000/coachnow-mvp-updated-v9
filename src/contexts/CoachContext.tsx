import { createContext, useContext, useState, ReactNode } from 'react';
import { Coach, mockCoaches } from '../lib/mockData';

interface CoachContextType {
  coaches: Coach[];
  getCoach: (id: string) => Coach | undefined;
  updateCoach: (id: string, data: Partial<Coach>) => void;
  addCoach: (coach: Coach) => void;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function useCoaches() {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoaches must be used within CoachProvider');
  return ctx;
}

// Stores the FULL coaches list (mock data + any edits + any newly registered
// coaches) under one key. An earlier version only persisted brand-new
// coaches and silently dropped edits made to any of the 8 demo coaches on
// reload — this loads from storage if present, and always writes back the
// complete list on every change so nothing gets lost.
const STORAGE_KEY = 'coachnow_coaches_state';

function loadInitialCoaches(): Coach[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // fall through to defaults
  }
  return mockCoaches;
}

export function CoachProvider({ children }: { children: ReactNode }) {
  const [coaches, setCoaches] = useState<Coach[]>(loadInitialCoaches);

  const persist = (allCoaches: Coach[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCoaches));
  };

  const updateCoach = (id: string, data: Partial<Coach>) => {
    const updated = coaches.map(c => c.id === id ? { ...c, ...data } : c);
    setCoaches(updated);
    persist(updated);
  };

  const addCoach = (coach: Coach) => {
    const updated = [...coaches, coach];
    setCoaches(updated);
    persist(updated);
  };

  const getCoach = (id: string) => coaches.find(c => c.id === id);

  return (
    <CoachContext.Provider value={{ coaches, getCoach, updateCoach, addCoach }}>
      {children}
    </CoachContext.Provider>
  );
}
