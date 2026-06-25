import { describe, it, expect } from 'vitest';
import { generateReferralCode } from '../referral';

describe('generateReferralCode', () => {
  it('produces an uppercase, alphanumeric code', () => {
    const code = generateReferralCode('Sara Ahmed');
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('derives a name-based prefix from the given name', () => {
    const code = generateReferralCode('Mohamed');
    expect(code.startsWith('MOHA')).toBe(true);
  });

  it('falls back to a generic prefix for an empty name', () => {
    const code = generateReferralCode('');
    // 'FRIEND' sliced to 4 chars -> 'FRIE' (name is always required at
    // registration in practice, so this is just a defensive fallback)
    expect(code.startsWith('FRIE')).toBe(true);
  });

  it('strips non-letter characters from the name before using it', () => {
    const code = generateReferralCode("O'Brien-123");
    // Should only use the letters, not punctuation or digits, for the name part
    expect(code.slice(0, 4)).toMatch(/^[A-Z]+$/);
  });

  it('generates different codes on repeated calls (random suffix)', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode('Ahmed')));
    // Vanishingly unlikely all 20 collide if randomness is working
    expect(codes.size).toBeGreaterThan(1);
  });
});
