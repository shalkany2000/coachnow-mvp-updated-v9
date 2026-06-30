import { describe, it, expect } from 'vitest';
import { getPlanExpiryDate } from '../time';

describe('getPlanExpiryDate', () => {
  it('adds 30 days to the start date for a monthly plan', () => {
    expect(getPlanExpiryDate('2026-07-01', 'month')).toBe('2026-07-31');
  });

  it('adds 90 days to the start date for a term plan', () => {
    expect(getPlanExpiryDate('2026-07-01', 'term')).toBe('2026-09-29');
  });

  it('correctly rolls over a month boundary', () => {
    expect(getPlanExpiryDate('2026-01-20', 'month')).toBe('2026-02-19');
  });

  it('correctly rolls over a year boundary', () => {
    expect(getPlanExpiryDate('2026-12-15', 'month')).toBe('2027-01-14');
  });
});
