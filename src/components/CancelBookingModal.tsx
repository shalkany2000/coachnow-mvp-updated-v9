import { useState } from 'react';
import { X, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { Booking, DayKey } from '../lib/mockData';
import { useBookings } from '../contexts/BookingContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCoaches } from '../contexts/CoachContext';
import { getCancellationOutcome } from '../lib/cancellation';
import { generateSlots, formatTime } from '../utils/time';
import { Button } from './ui/Button';

interface CancelBookingModalProps {
  booking: Booking;
  onClose: () => void;
}

const DAY_NAMES: DayKey[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CancelBookingModal({ booking, onClose }: CancelBookingModalProps) {
  const { settings } = useSettings();
  const { cancelBooking, rescheduleBooking } = useBookings();
  const { getCoach } = useCoaches();
  const [mode, setMode] = useState<'choose' | 'reschedule'>('choose');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ type: 'cancelled'; credit: number } | { type: 'rescheduled' } | null>(null);

  const outcome = getCancellationOutcome(booking.date, booking.time, booking.price, settings);
  const coach = getCoach(booking.coachId);
  const today = new Date().toISOString().split('T')[0];

  const selectedDayName = newDate ? DAY_NAMES[new Date(newDate + 'T00:00:00').getDay()] : null;
  const daySchedule = selectedDayName ? coach?.weeklySchedule?.[selectedDayName] : undefined;
  const timeSlots = daySchedule ? generateSlots(daySchedule.start, daySchedule.end, booking.duration) : [];

  const handleCancel = async () => {
    setLoading(true); setError('');
    try {
      const outcomeResult = await cancelBooking(booking.id);
      setResult({ type: 'cancelled', credit: outcomeResult.refundCreditAmount });
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError("Couldn't cancel — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) { setError('Pick a new date and time first.'); return; }
    setLoading(true); setError('');
    try {
      await rescheduleBooking(booking.id, newDate, newTime);
      setResult({ type: 'rescheduled' });
    } catch (err) {
      console.error('Failed to reschedule booking:', err);
      setError(err instanceof Error ? err.message : "Couldn't reschedule — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {result ? (
          <div className="text-center pt-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {result.type === 'cancelled' ? <Calendar className="w-6 h-6 text-emerald-600" /> : <RefreshCw className="w-6 h-6 text-emerald-600" />}
            </div>
            {result.type === 'cancelled' ? (
              <>
                <h3 className="font-bold text-lg text-gray-900">Booking cancelled</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {result.credit > 0
                    ? `AED ${result.credit} has been added to your CoachNow credit — it'll apply automatically toward your next booking.`
                    : "This cancellation was inside the no-refund window, so no credit was issued this time."}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg text-gray-900">Session rescheduled</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Your new time is pending the coach's confirmation, same as any new booking request.
                </p>
              </>
            )}
            <Button fullWidth className="mt-5" onClick={onClose}>Done</Button>
          </div>
        ) : mode === 'choose' ? (
          <>
            <div className="text-center pt-2 pb-4">
              <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Cancel or reschedule?</h3>
              <p className="text-sm text-gray-500 mt-1">{booking.sportType} with {booking.coachName}</p>
            </div>

            <div className={`rounded-xl px-4 py-3 text-sm ${outcome.tier === 'full' ? 'bg-emerald-50 text-emerald-800' : outcome.tier === 'partial' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>
              {outcome.tier === 'full' && (
                <p>You're cancelling with plenty of notice — <strong>AED {outcome.refundCreditAmount} full credit</strong> will be added to your account.</p>
              )}
              {outcome.tier === 'partial' && (
                <p>This is within {settings.cancellationFullRefundHours}h of your session — you'll get <strong>AED {outcome.refundCreditAmount} credit</strong> ({outcome.penaltyPercent}% forfeited).</p>
              )}
              {outcome.tier === 'none' && (
                <p>This is within {settings.cancellationPartialRefundHours}h of your session — <strong>no credit will be issued</strong> for this cancellation.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}

            <div className="flex flex-col gap-2.5 mt-5">
              {outcome.canReschedule && (
                <Button variant="outline" fullWidth onClick={() => setMode('reschedule')}>
                  Reschedule instead (no penalty)
                </Button>
              )}
              <Button variant="danger" fullWidth loading={loading} onClick={handleCancel}>
                Cancel Booking
              </Button>
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium py-1">
                Never mind
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="pt-2 pb-4">
              <h3 className="font-bold text-lg text-gray-900">Pick a new time</h3>
              <p className="text-sm text-gray-500 mt-1">{booking.sportType} with {booking.coachName} — no penalty since you're well ahead of the original session.</p>
            </div>

            <label className="text-sm font-medium text-gray-700 block mb-1.5">New date</label>
            <input
              type="date"
              min={today}
              value={newDate}
              onChange={(e) => { setNewDate(e.target.value); setNewTime(''); }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all mb-4"
            />

            {newDate && (
              <>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">New time</label>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-red-500 mb-2">{booking.coachName} doesn't coach on {selectedDayName}s — pick another date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setNewTime(slot)}
                        className={`text-sm font-medium py-2 rounded-lg border-2 transition-colors ${
                          newTime === slot ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {error && <p className="text-sm text-red-600 font-medium mt-2">{error}</p>}

            <div className="flex gap-3 mt-5">
              <Button variant="outline" fullWidth onClick={() => setMode('choose')}>Back</Button>
              <Button fullWidth loading={loading} disabled={!newDate || !newTime} onClick={handleReschedule}>
                Confirm
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
