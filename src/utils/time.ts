// Formats a 24h "HH:mm" string as a 12h display string, e.g. "09:00" -> "9:00 AM"
export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// Generates back-to-back session slots between a coach's start/end working
// hours, spaced by their actual session length, e.g. start="08:00" end="12:00"
// duration=45 gives ['08:00', '08:45', '09:30', '10:15', '11:00'] — the last
// slot still leaves room for a full session before the working window ends.
export function generateSlots(start: string, end: string, durationMinutes: number): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  const slots: string[] = [];
  for (let t = startMin; t + durationMinutes <= endMin; t += durationMinutes) {
    const h = Math.floor(t / 60).toString().padStart(2, '0');
    const m = (t % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

// Formats an ISO timestamp as a short relative string, e.g. "5m ago",
// "3h ago", "2d ago" — falls back to a short date once it's over a week old.
export function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoTimestamp).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

// A group plan runs for a fixed window from its start date — 30 days for a
// monthly package, 90 days for a 3-month term — regardless of how many of
// the included sessions actually get used in that window. Returns an ISO
// date string (YYYY-MM-DD).
export function getPlanExpiryDate(startDate: string, packageType: 'month' | 'term'): string {
  const days = packageType === 'month' ? 30 : 90;
  const start = new Date(startDate + 'T00:00:00');
  start.setDate(start.getDate() + days);
  return start.toISOString().split('T')[0];
}
