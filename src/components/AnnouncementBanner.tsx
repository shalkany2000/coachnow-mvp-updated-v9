import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const DISMISSED_KEY = 'coachnow_announcement_dismissed';

export function AnnouncementBanner() {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(true);

  // The dismissal is remembered per-message — if admin changes the
  // announcement text, anyone who dismissed the old one sees the new one.
  useEffect(() => {
    if (!settings.announcementMessage) { setDismissed(true); return; }
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === settings.announcementMessage);
    } catch {
      setDismissed(false);
    }
  }, [settings.announcementMessage]);

  if (!settings.announcementEnabled || !settings.announcementMessage || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, settings.announcementMessage);
    } catch {
      // localStorage unavailable — banner just won't stay dismissed across reloads
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <Megaphone className="w-4 h-4 flex-shrink-0" />
        <p className="text-sm font-medium flex-1 leading-snug">{settings.announcementMessage}</p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
