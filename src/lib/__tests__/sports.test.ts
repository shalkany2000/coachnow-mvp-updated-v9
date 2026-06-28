import { describe, it, expect } from 'vitest';
import { isSeedCoach, isSportLive, visibleCoaches, ALWAYS_ACTIVE_SPORTS } from '../sports';
import { Coach } from '../mockData';

function makeCoach(overrides: Partial<Coach>): Coach {
  return {
    id: 'real_coach_1',
    userId: 'user_1',
    name: 'Test Coach',
    email: 'test@example.com',
    sportType: 'Swimming',
    pricePerHour: 200,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: '',
    avatar: '',
    experience: '5 years',
    languages: ['English'],
    availability: ['Mon'],
    availabilityStart: '08:00',
    availabilityEnd: '18:00',
    sessionDuration: 60,
    verified: false,
    ...overrides,
  };
}

describe('isSeedCoach', () => {
  it('identifies the 8 known starter-catalog IDs as seed coaches', () => {
    expect(isSeedCoach(makeCoach({ id: 'coach1' }))).toBe(true);
    expect(isSeedCoach(makeCoach({ id: 'coach8' }))).toBe(true);
  });

  it('does not flag a real registered coach as a seed coach', () => {
    expect(isSeedCoach(makeCoach({ id: 'user_abc123' }))).toBe(false);
  });
});

describe('isSportLive', () => {
  it('treats every one of the 6 launch sports as live, even with zero coaches', () => {
    ALWAYS_ACTIVE_SPORTS.forEach((sport) => {
      expect(isSportLive(sport, [])).toBe(true);
    });
  });

  it('gates a hypothetical future sport until a real coach registers under it', () => {
    // Squash isn't part of the launch catalog - this verifies the gating
    // mechanism itself still works correctly for whatever gets added next,
    // even though nothing currently uses it.
    const coaches = [makeCoach({ id: 'coach6', sportType: 'Squash' })];
    expect(isSportLive('Squash', coaches)).toBe(false);
  });

  it('goes live the moment a real coach registers under a gated sport', () => {
    const coaches = [
      makeCoach({ id: 'coach6', sportType: 'Squash' }), // seed, doesn't count
      makeCoach({ id: 'user_real_squash_coach', sportType: 'Squash' }), // real registration
    ];
    expect(isSportLive('Squash', coaches)).toBe(true);
  });

  it('a real coach in one gated sport does not make a different gated sport live', () => {
    const coaches = [makeCoach({ id: 'user_real_coach', sportType: 'Squash' })];
    expect(isSportLive('Cricket', coaches)).toBe(false);
  });
});

describe('visibleCoaches', () => {
  it('hides seed coaches for sports that are not live yet', () => {
    const coaches = [
      makeCoach({ id: 'coach1', sportType: 'Swimming' }), // seed, but an always-active launch sport
      makeCoach({ id: 'coach6', sportType: 'Squash' }),   // seed, gated sport -> hidden
    ];
    const visible = visibleCoaches(coaches);
    expect(visible.map((c) => c.id)).toEqual(['coach1']);
  });

  it('always shows real coaches regardless of sport', () => {
    const coaches = [
      makeCoach({ id: 'user_real_padel_coach', sportType: 'Padel' }),
    ];
    expect(visibleCoaches(coaches)).toHaveLength(1);
  });

  it('keeps every launch sport visible even as seed data', () => {
    ALWAYS_ACTIVE_SPORTS.forEach((sport) => {
      const coaches = [makeCoach({ id: 'coach1', sportType: sport })];
      expect(visibleCoaches(coaches)).toHaveLength(1);
    });
  });
});
