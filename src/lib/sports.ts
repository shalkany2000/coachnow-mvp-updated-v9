import { Coach } from './mockData';

// All 6 launch sports are active immediately — academies are onboarded
// directly by the business, not grown organically from a starter catalog
// the way individual freelance coaches once were. The gating mechanism
// below still exists for if a 7th sport is ever added before any real
// academy has joined under it.
export const ALWAYS_ACTIVE_SPORTS = ['Swimming', 'Football', 'Gym', 'Tennis', 'Basketball', 'Padel'];

const SEED_COACH_IDS = new Set([
  'coach1', 'coach2', 'coach3', 'coach4', 'coach5', 'coach6', 'coach7', 'coach8',
]);

export function isSeedCoach(coach: Coach): boolean {
  return SEED_COACH_IDS.has(coach.id);
}

// A sport is "live" (shown normally, bookable) if it's always-active, or
// if at least one real coach (anyone who registered through the actual
// sign-up flow, not the starter catalog) has joined under it.
export function isSportLive(sport: string, coaches: Coach[]): boolean {
  if (ALWAYS_ACTIVE_SPORTS.includes(sport)) return true;
  return coaches.some((c) => c.sportType === sport && !isSeedCoach(c));
}

// Filters the full coach list down to what real customers should actually
// see — demo coaches are hidden for any sport that isn't live yet. Real
// coaches (anyone who's genuinely registered) are always visible,
// regardless of sport.
export function visibleCoaches(coaches: Coach[]): Coach[] {
  return coaches.filter((c) => !isSeedCoach(c) || ALWAYS_ACTIVE_SPORTS.includes(c.sportType));
}
