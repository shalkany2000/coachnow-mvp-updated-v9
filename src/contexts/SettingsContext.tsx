import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PlatformSettings {
  commissionRate: number; // e.g. 0.15 means 15%
  firstBookingDiscountEnabled: boolean;
  firstBookingDiscountPercent: number; // e.g. 50 means 50% off
  announcementEnabled: boolean;
  announcementMessage: string;
  referralProgramEnabled: boolean;
  referralDiscountPercent: number; // % off the referrer's next booking, once unlocked
  cancellationFullRefundHours: number; // cancel at/before this many hours out: full refund as credit
  cancellationPartialRefundHours: number; // cancel at/before this many hours out (but past the full-refund window): partial credit
  cancellationPartialPenaltyPercent: number; // % forfeited in that partial window (e.g. 30 means keep 70% as credit)
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionRate: 0.15,
  firstBookingDiscountEnabled: true,
  firstBookingDiscountPercent: 50,
  announcementEnabled: true,
  announcementMessage: '🎉 New here? Get 50% off your first booking — automatically applied at checkout.',
  referralProgramEnabled: true,
  referralDiscountPercent: 10,
  cancellationFullRefundHours: 24,
  cancellationPartialRefundHours: 5,
  cancellationPartialPenaltyPercent: 30,
};
const DOC_PATH = ['settings', 'platform'] as const;

interface SettingsContextType {
  settings: PlatformSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (data: Partial<PlatformSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSeeded = useRef(false);

  useEffect(() => {
    const ref = doc(db, ...DOC_PATH);
    const unsubscribe = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists() && !hasSeeded.current) {
          hasSeeded.current = true;
          try {
            await setDoc(ref, DEFAULT_SETTINGS);
          } catch (err) {
            console.error('Failed to seed platform settings:', err);
            setError('Could not load settings. Check your connection and reload.');
            setLoading(false);
          }
          return;
        }
        setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<PlatformSettings>) });
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Settings subscription error:', err);
        setError('Could not load settings. Check your connection and reload.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = async (data: Partial<PlatformSettings>) => {
    await updateDoc(doc(db, ...DOC_PATH), data);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
