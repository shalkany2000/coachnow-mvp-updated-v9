import { PlatformSettings } from '../contexts/SettingsContext';

export interface CancellationOutcome {
  hoursUntilSession: number;
  tier: 'full' | 'partial' | 'none';
  penaltyPercent: number; // % forfeited
  refundCreditAmount: number; // AED credited back
  canReschedule: boolean; // rescheduling (no penalty) is only offered in the full-refund window
}

export function getSessionDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function hoursUntil(date: string, time: string): number {
  const sessionTime = getSessionDateTime(date, time).getTime();
  return (sessionTime - Date.now()) / (1000 * 60 * 60);
}

// The actual policy, in one place: cancel with plenty of notice and get
// everything back as credit; cut it close and lose a slice; cancel last
// minute and forfeit the lot. Rescheduling avoids any penalty entirely,
// but only within that same generous early window — it's meant to reward
// planning ahead, not to be a loophole around the cancellation penalty.
export function getCancellationOutcome(
  date: string,
  time: string,
  bookingPrice: number,
  settings: PlatformSettings
): CancellationOutcome {
  const hours = hoursUntil(date, time);

  if (hours >= settings.cancellationFullRefundHours) {
    return {
      hoursUntilSession: hours,
      tier: 'full',
      penaltyPercent: 0,
      refundCreditAmount: bookingPrice,
      canReschedule: true,
    };
  }

  if (hours >= settings.cancellationPartialRefundHours) {
    const penaltyPercent = settings.cancellationPartialPenaltyPercent;
    const refundCreditAmount = Math.round(bookingPrice * (1 - penaltyPercent / 100));
    return {
      hoursUntilSession: hours,
      tier: 'partial',
      penaltyPercent,
      refundCreditAmount,
      canReschedule: false,
    };
  }

  return {
    hoursUntilSession: hours,
    tier: 'none',
    penaltyPercent: 100,
    refundCreditAmount: 0,
    canReschedule: false,
  };
}

// Critical: a booking only gets refund credit if it was actually paid for.
// Payment happens manually via WhatsApp after a request is made, so most
// pending/accepted bookings are unpaid at the time of cancellation —
// without this check, anyone could repeatedly book then cancel and
// accumulate unlimited free credit for sessions they never paid for.
// Centralized here (rather than duplicated inline in both BookingContext
// and CancelBookingModal) specifically so there's one tested place this
// rule lives, not two places that could silently drift apart.
export function resolveActualRefund(outcome: CancellationOutcome, wasPaid: boolean): { refundCreditAmount: number; penaltyPercent: number } {
  if (!wasPaid) return { refundCreditAmount: 0, penaltyPercent: 0 };
  return { refundCreditAmount: outcome.refundCreditAmount, penaltyPercent: outcome.penaltyPercent };
}
