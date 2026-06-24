import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, Clock, MapPin, FileText, ArrowLeft, CheckCircle, ShieldCheck, MessageCircle } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from '../../contexts/BookingContext';
import { useSettings } from '../../contexts/SettingsContext';
import { isSeedCoach, isSportLive } from '../../lib/sports';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatTime, generateSlots } from '../../utils/time';
import { buildAdminWhatsAppLink, VAT_RATE, SERVICE_FEE_AED } from '../../lib/config';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCoach, coaches } = useCoaches();
  const { currentUser } = useAuth();
  const { addBooking, getBookingsForParent } = useBookings();
  const { settings } = useSettings();
  const coach = getCoach(id || '');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isHidden = coach && isSeedCoach(coach) && !isSportLive(coach.sportType, coaches);

  if (!coach || isHidden) {
    return (
      <div className="min-h-screen bg-gray-50"><Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Coach not found</h2>
            <Button onClick={() => navigate('/coaches')}>Back to Coaches</Button>
          </div>
        </div>
      </div>
    );
  }

  if (coach.onLeave) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">🌴 {coach.name} is on leave</h2>
            <p className="text-gray-500 mb-4">They aren't accepting new bookings right now — check back soon.</p>
            <Button onClick={() => navigate('/coaches')}>Find Another Coach</Button>
          </div>
        </div>
      </div>
    );
  }

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  // A parent's very first booking ever (regardless of its eventual status)
  // gets the discount — checking "do they have any prior booking at all"
  // rather than "any paid one" keeps this simple and not gameable by
  // cancelling and re-booking.
  const isFirstBooking = currentUser
    ? getBookingsForParent(currentUser.id, currentUser.email).length === 0
    : false;
  const firstBookingDiscountApplies = settings.firstBookingDiscountEnabled && isFirstBooking;
  const referralDiscountApplies = !!currentUser?.pendingReferralDiscountPercent;

  const originalPrice = coach.pricePerHour;
  const firstBookingDiscountAmount = firstBookingDiscountApplies
    ? Math.round(originalPrice * (settings.firstBookingDiscountPercent / 100))
    : 0;
  const referralDiscountAmount = referralDiscountApplies
    ? Math.round(originalPrice * ((currentUser?.pendingReferralDiscountPercent || 0) / 100))
    : 0;

  // If both are somehow available (e.g. someone shares their code before
  // ever booking themselves), whichever discount is worth more wins —
  // no stacking, simplest to reason about and always the better deal for
  // the customer.
  const usingReferralDiscount = referralDiscountAmount > firstBookingDiscountAmount;
  const discountApplies = firstBookingDiscountApplies || referralDiscountApplies;
  const discountAmount = usingReferralDiscount ? referralDiscountAmount : firstBookingDiscountAmount;
  const discountLabel = usingReferralDiscount
    ? `Referral reward (${currentUser?.pendingReferralDiscountPercent}%)`
    : `First booking discount (${settings.firstBookingDiscountPercent}%)`;
  const finalPrice = originalPrice - discountAmount;

  const commission = Math.round(finalPrice * settings.commissionRate);
  const coachEarnings = finalPrice - commission;

  // Service fee and VAT are customer-facing charges added on top of the
  // session price — they go entirely to the platform (not split with the
  // coach), same as how Uber/Airbnb service fees work. VAT is calculated
  // on (session price + service fee), matching standard UAE VAT practice.
  const serviceFee = SERVICE_FEE_AED;
  const vatAmount = Math.round((finalPrice + serviceFee) * VAT_RATE);
  const totalCharged = finalPrice + serviceFee + vatAmount;

  const timeSlots = generateSlots(coach.availabilityStart, coach.availabilityEnd, coach.sessionDuration);
  const selectedDayName = date ? DAY_NAMES[new Date(date + 'T00:00:00').getDay()] : null;
  const isDayAvailable = !selectedDayName || coach.availability.includes(selectedDayName);

  const adminMessage = `Hi, I just booked a session on CoachNow and I'd like to pay.\n\nCoach: ${coach.name}\nSport: ${coach.sportType}\nDate: ${date}\nTime: ${time ? formatTime(time) : ''}\nDuration: ${coach.sessionDuration} min\n${discountApplies ? `Session price: AED ${originalPrice} - ${discountLabel} = AED ${finalPrice}\n` : `Session price: AED ${finalPrice}\n`}Service fee: AED ${serviceFee}\nVAT (5%): AED ${vatAmount}\nTotal to pay: AED ${totalCharged}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    if (!date) { setError('Please select a date.'); return; }
    if (!isDayAvailable) { setError(`${coach.name} isn't available on ${selectedDayName}s. Please pick one of their available days.`); return; }
    if (!time) { setError('Please select a time slot.'); return; }
    setLoading(true); setError('');
    try {
      await addBooking({
        parentId: currentUser.id,
        parentName: currentUser.name,
        parentEmail: currentUser.email,
        parentPhone: currentUser.phone,
        coachId: coach.id,
        coachName: coach.name,
        sportType: coach.sportType,
        date,
        time,
        duration: coach.sessionDuration,
        status: 'pending',
        paid: false,
        price: finalPrice,
        commission,
        coachEarnings,
        location: coach.location,
        notes,
        serviceFee,
        vatAmount,
        ...(discountApplies ? {
          originalPrice,
          discountAmount,
          discountReason: discountLabel,
        } : {}),
      });

      // The referral reward is one-time use — clear it now that it's been
      // applied, so it can't be reused on a future booking.
      if (usingReferralDiscount && currentUser) {
        await updateDoc(doc(db, 'users', currentUser.id), { pendingReferralDiscountPercent: null });
      }

      setSuccess(true);
    } catch (err) {
      console.error('Booking failed:', err);
      setError('Booking failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Requested! 🎉</h2>
            <p className="text-gray-500 mb-2">
              Your booking request has been sent to <strong>{coach.name}</strong>.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              One last step — message our team on WhatsApp to receive your secure payment link.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coach</span>
                <span className="font-semibold text-gray-800">{coach.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-800">{new Date(date).toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-semibold text-gray-800">{formatTime(time)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold text-gray-800">{coach.sessionDuration} minutes</span>
              </div>
              {discountApplies && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Original price</span>
                    <span className="text-gray-400 line-through">AED {originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">{discountLabel}</span>
                    <span className="font-semibold text-emerald-600">- AED {discountAmount}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Session price</span>
                <span className="font-semibold text-gray-800">AED {finalPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service fee</span>
                <span className="font-semibold text-gray-800">AED {serviceFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (5%)</span>
                <span className="font-semibold text-gray-800">AED {vatAmount}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-800 font-semibold">Total</span>
                <span className="font-bold text-blue-600">AED {totalCharged}</span>
              </div>
            </div>

            <a
              href={buildAdminWhatsAppLink(adminMessage)}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold rounded-xl py-3.5 text-sm transition-colors mb-3"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp to Pay
            </a>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => navigate('/coaches')}>
                Find More Coaches
              </Button>
              <Button fullWidth onClick={() => navigate('/parent/bookings')}>
                My Bookings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/coaches/${coach.id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </button>

        <h1 className="text-2xl font-black text-gray-900 mb-6">Book a Session</h1>

        {discountApplies && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">{usingReferralDiscount ? '🎁' : '🎉'}</span>
            <div>
              <p className="text-white font-bold text-sm">
                {usingReferralDiscount ? 'Your referral reward is here!' : 'Welcome to CoachNow!'}
              </p>
              <p className="text-emerald-50 text-xs mt-0.5">
                {usingReferralDiscount
                  ? `Thanks for referring a friend — we've automatically applied your ${currentUser?.pendingReferralDiscountPercent}% reward.`
                  : `This is your first booking — we've automatically applied a ${settings.firstBookingDiscountPercent}% discount.`}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
                  {error}
                </div>
              )}

              {/* Date */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Select Date
                </h2>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={e => { setDate(e.target.value); setTime(''); setError(''); }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                {date && isDayAvailable && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(date).toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {date && !isDayAvailable && (
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    {coach.name} doesn't coach on {selectedDayName}s. Available days: {coach.availability.join(', ')}.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {coach.name.split(' ')[0]} coaches on {coach.availability.join(', ')}.
                </p>
              </Card>

              {/* Time */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Select Time
                </h2>
                <p className="text-xs text-gray-400 mb-3">
                  Available {formatTime(coach.availabilityStart)} – {formatTime(coach.availabilityEnd)}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        time === slot
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Location */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location
                </h2>
                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{coach.location}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Coach's primary training location. Exact address shared after confirmation.</p>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Session Notes (Optional)
                </h2>
                <textarea
                  placeholder="Tell the coach about your goals, skill level, age, or any special requirements..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </Card>

              {/* Payment */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Payment
                </h2>
                <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Secure online payment via WhatsApp</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      After you send this booking request, you'll be taken to WhatsApp to chat with our team — we'll send you a secure payment link to complete your booking online. No cash, no card-on-site.
                    </p>
                  </div>
                </div>
              </Card>

              <Button type="submit" fullWidth size="lg" loading={loading} disabled={!isDayAvailable}>
                Send Booking Request
              </Button>
            </form>
          </div>

          {/* Summary Sidebar */}
          <div>
            <Card className="sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <img
                  src={coach.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=60`}
                  alt={coach.name}
                  className="w-12 h-12 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=60`;
                  }}
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{coach.name}</p>
                  <p className="text-xs text-blue-600">{coach.sportType}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {coach.location}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-800">{date ? new Date(date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium text-gray-800">{time ? formatTime(time) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-800">{coach.sessionDuration} minutes</span>
                </div>
                {discountApplies && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-base">{usingReferralDiscount ? '🎁' : '🎉'}</span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {discountLabel} applied!
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {discountApplies && (
                    <>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-500">Original price</span>
                        <span className="text-gray-400 line-through">AED {originalPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-emerald-600">Discount</span>
                        <span className="font-medium text-emerald-600">- AED {discountAmount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Session price</span>
                    <span className="text-gray-700">AED {finalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Service fee</span>
                    <span className="text-gray-700">AED {serviceFee}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">VAT (5%)</span>
                    <span className="text-gray-700">AED {vatAmount}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                    <span className="text-gray-800">Total</span>
                    <span className="text-blue-600">AED {totalCharged}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Pay securely online via the link our team sends on WhatsApp
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
