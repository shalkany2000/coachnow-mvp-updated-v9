import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Coach, mockCoaches } from '../lib/mockData';

interface CoachContextType {
  coaches: Coach[];
  loading: boolean;
  error: string | null;
  getCoach: (id: string) => Coach | undefined;
  updateCoach: (id: string, data: Partial<Coach>) => Promise<void>;
  addCoach: (coach: Coach) => Promise<void>;
  syncStarterListings: () => Promise<void>;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function useCoaches() {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoaches must be used within CoachProvider');
  return ctx;
}

const COLLECTION = 'coaches';

export function CoachProvider({ children }: { children: ReactNode }) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Guards against re-seeding in a loop — without it, every snapshot while
  // the seed writes are still landing would look "empty" and trigger another
  // seed attempt. Coach ids are fixed/deterministic (coach1, coach2, ...),
  // so even if two devices both seed on first-ever load, they overwrite the
  // same documents rather than creating duplicates.
  const hasSeeded = useRef(false);

  useEffect(() => {
    const coachesRef = collection(db, COLLECTION);

    const unsubscribe = onSnapshot(
      coachesRef,
      async (snapshot) => {
        if (snapshot.empty && !hasSeeded.current) {
          hasSeeded.current = true;
          try {
            await Promise.all(
              mockCoaches.map((coach) => setDoc(doc(db, COLLECTION, coach.id), coach))
            );
          } catch (err) {
            console.error('Failed to seed starter coaches:', err);
            setError('Could not load coaches. Check your connection and reload.');
            setLoading(false);
          }
          return; // onSnapshot fires again once the seed writes land
        }
        setCoaches(snapshot.docs.map((d) => d.data() as Coach));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Coaches subscription error:', err);
        setError('Could not load coaches. Check your connection and reload.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateCoach = async (id: string, data: Partial<Coach>) => {
    await updateDoc(doc(db, COLLECTION, id), data);
  };

  const addCoach = async (coach: Coach) => {
    await setDoc(doc(db, COLLECTION, coach.id), coach);
  };

  // The initial seed only ever fires once, when the collection is
  // completely empty — updating mockCoaches in code afterward never
  // touches documents that already exist live. This explicitly
  // overwrites just the 8 fixed starter-listing IDs (coach1-coach8) with
  // whatever's currently in mockCoaches, without touching any real
  // academy that's registered since — those have different, non-seed IDs.
  const syncStarterListings = async () => {
    await Promise.all(mockCoaches.map((c) => setDoc(doc(db, COLLECTION, c.id), c)));
  };

  const getCoach = (id: string) => coaches.find((c) => c.id === id);

  return (
    <CoachContext.Provider value={{ coaches, loading, error, getCoach, updateCoach, addCoach, syncStarterListings }}>
      {children}
    </CoachContext.Provider>
  );
}
