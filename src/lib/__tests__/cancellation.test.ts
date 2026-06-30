import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCancellationOutcome, resolveActualRefund } from '../cancellation';
import { PlatformSettings } from '../../contexts/SettingsContext';

const settings: PlatformSettings = {
  commissionRate: 0.15,
  firstBookingDiscountEnabled: true,
  firstBookingDiscountPercent: 50,
  announcementEnabled: false,
  announcementMessage: '',
  referralProgramEnabled: true,
  referralDiscountPercent: 10,
  cancellationFullRefundHours: 24,
  cancellationPartialRefundHours: 5,
  cancellationPartialPenaltyPercent: 30,
};

// Fixed "now" so every test is deterministic — booking times are
// constructed as offsets from this exact moment, not from whenever the
// test happens to run.
const NOW = new Date('2026-06-25T12:00:00');

function sessionAt(hoursFromNow: number): { date: string; time: string } {
  const t = new Date(NOW.getTime() + hoursFromNow * 60 * 60 * 1000);
  const date = t.toISOString().split('T')[0];
  const time = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

describe('getCancellationOutcome', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives a full refund with plenty of notice (well past 24h)', () => {
    const { date, time } = sessionAt(48);
    const outcome = getCancellationOutcome(date, time, 250, settings);
    expect(outcome.tier).toBe('full');
    expect(outcome.penaltyPercent).toBe(0);
    expect(outcome.refundCreditAmount).toBe(250);
    expect(outcome.canReschedule).toBe(true);
  });

  it('gives a partial refund inside the 24h window but outside 5h', () => {
    const { date, time } = sessionAt(10);
    const outcome = getCancellationOutcome(date, time, 250, settings);
    expect(outcome.tier).toBe('partial');
    expect(outcome.penaltyPercent).toBe(30);
    // 250 * (1 - 0.30) = 175
    expect(outcome.refundCreditAmount).toBe(175);
    expect(outcome.canReschedule).toBe(false);
  });

  it('gives zero refund inside the 5h window', () => {
    const { date, time } = sessionAt(2);
    const outcome = getCancellationOutcome(date, time, 250, settings);
    expect(outcome.tier).toBe('none');
    expect(outcome.penaltyPercent).toBe(100);
    expect(outcome.refundCreditAmount).toBe(0);
    expect(outcome.canReschedule).toBe(false);
  });

  it('gives zero refund for a session that has already passed', () => {
    const { date, time } = sessionAt(-5);
    const outcome = getCancellationOutcome(date, time, 250, settings);
    expect(outcome.tier).toBe('none');
    expect(outcome.refundCreditAmount).toBe(0);
  });

  it('treats exactly 24h as the full-refund boundary (inclusive)', () => {
    const { date, time } = sessionAt(24);
    const outcome = getCancellationOutcome(date, time, 100, settings);
    expect(outcome.tier).toBe('full');
  });

  it('treats exactly 5h as the partial-refund boundary (inclusive)', () => {
    const { date, time } = sessionAt(5);
    const outcome = getCancellationOutcome(date, time, 100, settings);
    expect(outcome.tier).toBe('partial');
  });

  it('respects custom admin-configured thresholds', () => {
    const customSettings: PlatformSettings = { ...settings, cancellationFullRefundHours: 48, cancellationPartialRefundHours: 12, cancellationPartialPenaltyPercent: 50 };
    const { date, time } = sessionAt(24); // would be "full" under defaults, but not under these custom settings
    const outcome = getCancellationOutcome(date, time, 200, customSettings);
    expect(outcome.tier).toBe('partial');
    expect(outcome.refundCreditAmount).toBe(100); // 200 * (1 - 0.50)
  });

  it('rounds the partial refund amount to a whole AED', () => {
    const { date, time } = sessionAt(10);
    const outcome = getCancellationOutcome(date, time, 199, settings);
    // 199 * 0.70 = 139.3 -> rounds to 139
    expect(outcome.refundCreditAmount).toBe(139);
  });

  it('never returns a negative refund amount, even with a zero price', () => {
    const { date, time } = sessionAt(48);
    const outcome = getCancellationOutcome(date, time, 0, settings);
    expect(outcome.refundCreditAmount).toBe(0);
  });
});

describe('resolveActualRefund — the critical "must actually be paid" guard', () => {
  it('blocks all credit for an unpaid booking, even with maximum notice', () => {
    const outcome = { hoursUntilSession: 48, tier: 'full' as const, penaltyPercent: 0, refundCreditAmount: 270, canReschedule: true };
    const result = resolveActualRefund(outcome, false);
    expect(result.refundCreditAmount).toBe(0);
    expect(result.penaltyPercent).toBe(0);
  });

  it('passes through the full computed refund for a paid booking', () => {
    const outcome = { hoursUntilSession: 48, tier: 'full' as const, penaltyPercent: 0, refundCreditAmount: 270, canReschedule: true };
    const result = resolveActualRefund(outcome, true);
    expect(result.refundCreditAmount).toBe(270);
  });

  it('passes through a partial refund for a paid booking', () => {
    const outcome = { hoursUntilSession: 10, tier: 'partial' as const, penaltyPercent: 30, refundCreditAmount: 175, canReschedule: false };
    const result = resolveActualRefund(outcome, true);
    expect(result.refundCreditAmount).toBe(175);
    expect(result.penaltyPercent).toBe(30);
  });

  it('this is exactly the exploit that existed before this guard: book, never pay, cancel for free credit', () => {
    // Simulates the real scenario the bug allowed: a brand new booking,
    // never paid, cancelled immediately with maximum notice.
    const outcome = getCancellationOutcome('2026-07-01', '10:00', 270, settings);
    const wasPaid = false;
    const result = resolveActualRefund(outcome, wasPaid);
    expect(result.refundCreditAmount).toBe(0);
  });
});

describe('getCancellationOutcome — group plans (no specific time)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // Group plans have a start date but no single appointment time, so
  // `time` is passed in as ''. Before the fix, this produced an invalid
  // Date and NaN hours, which silently fell through to the harshest
  // "no refund" tier no matter how much notice was actually given.
  it('still gives a full refund with plenty of notice, even with an empty time string', () => {
    const farFutureDate = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const outcome = getCancellationOutcome(farFutureDate, '', 550, settings);
    expect(outcome.tier).toBe('full');
    expect(outcome.refundCreditAmount).toBe(550);
    expect(Number.isNaN(outcome.hoursUntilSession)).toBe(false);
  });

  it('correctly falls to the no-refund tier only when the start date has actually passed', () => {
    const pastDate = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const outcome = getCancellationOutcome(pastDate, '', 550, settings);
    expect(outcome.tier).toBe('none');
    expect(Number.isNaN(outcome.hoursUntilSession)).toBe(false);
  });
});
