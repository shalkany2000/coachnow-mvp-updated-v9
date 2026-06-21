import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestoreCollection<T>(collectionName: string, enabled: boolean = true) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const ref = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.docs.map((d) => d.data() as T));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore subscription error on "${collectionName}":`, err);
        setError('Could not load live data right now.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [collectionName, enabled]);

  return { data, loading, error };
}
