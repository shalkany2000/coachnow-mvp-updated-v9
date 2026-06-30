import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { formatTime, generateSlots, getPlanExpiryDate } from '../../utils/time';
import { buildAdminWhatsAppLink, buildWhatsAppLink, buildMapLink, isMapLink, VAT_RATE, SERVICE_FEE_AED, REFERRAL_DISCOUNT_CAP_AED } from '../../lib/config';
import { formatAcademyLocation, buildAcademyLocationSearchText, normalizeAcademyLocations } from '../../lib/mockData';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCoach, coaches } = useCoaches();
  const { currentUser } = useAuth();
  const { addBooking, getBookingsForParent } = useBookings();
  const { settings } = useSettings();
  const coach = getCoach(id || '');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [packageType, setPackageType] = useState<'session' | 'month' | 'term'>(() => {
    // Honor the plan the customer already picked on the profile page so the
    // choice they made carries through instead of silently resetting.
    const fromUrl = searchParams.get('plan');
    if (fromUrl === 'month' && coach?.monthlyPlan) return 'month';
    if (fromUrl === 'term' && coach?.termPlan) return 'term';
    if (fromUrl === 'session') return 'session';
    return coach?.monthlyPlan ? 'month' : 'session';
  });
  const [notes, setNotes] = useState('');
  // Group plans recur weekly, so instead of one appointment time, the
  // customer picks one or more weekly (day, time) slots they intend to
  // attend regularly — e.g. "Mon 5pm" and "Wed 5pm". Stored as
  // "Day|HH:mm" strings for easy toggling, converted to objects on submit.
  const [preferredSlotKeys, setPreferredSlotKeys] = useState<string[]>([]);
  const [trainingAddress, setTrainingAddress] = useState(currentUser?.homeAddress || '');
  const [trainingMode, setTrainingMode] = useState<'at_academy' | 'at_home'>(
    coach?.locations && coach.locations.length > 0 ? 'at_academy' : 'at_home'
  );
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Captured at the moment of submission — without this, the success
  // screen and WhatsApp messages would recompute live, and the discount
  // would silently vanish the instant the new booking lands in this
  // parent's own booking list (since "is this their first booking" goes
  // from true to false the moment their own new booking exists).
  const [confirmedSummary, setConfirmedSummary] = useState<{
    discountApplies: boolean;
    originalPrice: number;
    discountAmount: number;
    discountLabel: string;
    finalPrice: number;
    serviceFee: number;
    vatAmount: number;
    creditApplied: number;
    amountDueNow: number;
    adminMessage: string;
    coachMessage: string;
    planExpiresAt: string | null;
    preferredSlots: { day: string; time: string }[];
  } | null>(null);
  const [error, setError] = useState('');

  const isHidden = coach && isSeedCoach(coach) && !isSportLive(coach.sportType, coaches);

  if (!coach || isHidden) {
    return (
      <div className="min-h-screen bg-gray-50"><Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Academy not found</h2>
            <Button onClick={() => navigate('/coaches')}>Back to Academies</Button>
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
            <Button onClick={() => navigate('/coaches')}>Find Another Academy</Button>
          </div>
        </div>
      </div>
    );
  }

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  // Defends against locations saved before this structured emirate/area
  // format existed (when a location was just a plain string).
  const normalizedLocations = normalizeAcademyLocations(coach.locations);

  // A parent's very first booking ever (regardless of its eventual status)
  // gets the discount — checking "do they have any prior booking at all"
  // rather than "any paid one" keeps this simple and not gameable by
  // cancelling and re-booking.
  const isFirstBooking = currentUser
    ? getBookingsForParent(currentUser.id, currentUser.email).length === 0
    : false;

  // Discounts only apply to single-session bookings — a monthly or term
  // package is a much bigger commitment, and applying the same
  // percentage off automatically could mean an unintentionally large
  // discount on a big-ticket package (e.g. 50% off a 3-month term).
  const discountsEligible = packageType === 'session';
  const firstBookingDiscountApplies = discountsEligible && settings.firstBookingDiscountEnabled && isFirstBooking;
  const referralDiscountApplies = discountsEligible && !!currentUser?.pendingReferralDiscountPercent;

  const selectedPlan = packageType === 'month' ? coach.monthlyPlan : packageType === 'term' ? coach.termPlan : null;
  const originalPrice = selectedPlan ? selectedPlan.price : coach.pricePerHour;
  const firstBookingDiscountAmount = firstBookingDiscountApplies
    ? Math.round(originalPrice * (settings.firstBookingDiscountPercent / 100))
    : 0;
  const referralDiscountAmount = referralDiscountApplies
    ? Math.min(
        Math.round(originalPrice * ((currentUser?.pendingReferralDiscountPercent || 0) / 100)),
        REFERRAL_DISCOUNT_CAP_AED
      )
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

  // Who actually funds each discount is a real business policy, not just
  // a display detail — it changes what the coach gets paid:
  //   - First-booking discount: a coach-funded "try me" cost. The
  //     platform's commission stays exactly what it would have been on
  //     the FULL price; the coach's earnings absorb the discount.
  //   - Referral discount: a platform-funded growth cost. The coach earns
  //     their normal full amount; the platform's commission absorbs the
  //     discount instead.
  // Both are floored so neither side is ever asked to pay out more than
  // was actually collected from the customer on this specific booking —
  // if a discount is larger than what the funding side's normal cut would
  // have covered, that side just earns AED 0 on this one booking rather
  // than going negative.
  const normalCommission = Math.round(originalPrice * settings.commissionRate);
  const normalCoachEarnings = originalPrice - normalCommission;

  let commission: number;
  let coachEarnings: number;

  if (discountApplies && usingReferralDiscount) {
    commission = Math.max(0, normalCommission - discountAmount);
    coachEarnings = finalPrice - commission;
  } else if (discountApplies) {
    commission = Math.min(normalCommission, finalPrice);
    coachEarnings = finalPrice - commission;
  } else {
    commission = normalCommission;
    coachEarnings = normalCoachEarnings;
  }

  // Service fee and VAT are customer-facing charges added on top of the
  // session price — they go entirely to the platform (not split with the
  // coach), same as how Uber/Airbnb service fees work. VAT is calculated
  // on (session price + service fee), matching standard UAE VAT practice.
  const serviceFee = SERVICE_FEE_AED;
  const vatAmount = Math.round((finalPrice + serviceFee) * VAT_RATE);
  const totalCharged = finalPrice + serviceFee + vatAmount;

  const creditAvailable = currentUser?.creditBalance || 0;
  const [useCredit, setUseCredit] = useState(creditAvailable > 0);
  const creditApplied = useCredit ? Math.min(creditAvailable, totalCharged) : 0;
  const amountDueNow = totalCharged - creditApplied;

  const selectedDayName = date ? DAY_NAMES[new Date(date + 'T00:00:00').getDay()] : null;
  const dayBlocks = selectedDayName ? coach.weeklySchedule?.[selectedDayName as keyof typeof coach.weeklySchedule] : undefined;
  const workingDays = coach.weeklySchedule ? Object.keys(coach.weeklySchedule) : coach.availability;
  const isDayAvailable = !selectedDayName || (!!dayBlocks && dayBlocks.length > 0);
  const timeSlots = dayBlocks && dayBlocks.length > 0
    ? dayBlocks.flatMap((block) => generateSlots(block.start, block.end, coach.sessionDuration))
    : (!coach.weeklySchedule ? generateSlots(coach.availabilityStart, coach.availabilityEnd, coach.sessionDuration) : []);

  // For group plans, every working day the academy runs is a candidate for
  // a recurring weekly slot — built the same way single-session times are,
  // just for every available day at once instead of one selected date.
  const weeklySlotOptions: { day: string; time: string }[] = coach.weeklySchedule
    ? Object.entries(coach.weeklySchedule).flatMap(([day, blocks]) =>
        (blocks || []).flatMap((block) => generateSlots(block.start, block.end, coach.sessionDuration).map((t) => ({ day, time: t })))
      )
    : workingDays.flatMap((day) => generateSlots(coach.availabilityStart, coach.availabilityEnd, coach.sessionDuration).map((t) => ({ day, time: t })));

  const togglePreferredSlot = (day: string, t: string) => {
    const key = `${day}|${t}`;
    setPreferredSlotKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };
  const preferredSlots = preferredSlotKeys.map((k) => {
    const [day, t] = k.split('|');
    return { day, time: t };
  });

  // A group plan's window is fixed from its start date — 30 days for
  // monthly, 90 for term — independent of how many sessions actually get
  // used inside it.
  const planExpiresAt = date && packageType !== 'session' ? getPlanExpiryDate(date, packageType) : null;

  const packageLabel = selectedPlan
    ? `${packageType === 'month' ? 'Monthly' : '3-month term'} package — ${selectedPlan.sessionsIncluded}${selectedPlan.freeSessions ? ` + ${selectedPlan.freeSessions} free` : ''} sessions`
    : 'Single session';

  const selectedAcademyLocation = normalizedLocations[selectedLocationIndex];
  const finalTrainingAddress = trainingMode === 'at_academy' && selectedAcademyLocation
    ? formatAcademyLocation(selectedAcademyLocation)
    : trainingAddress;

  const preferredSlotsText = preferredSlots.length > 0
    ? preferredSlots.map((s) => `${s.day} ${formatTime(s.time)}`).join(', ')
    : '';

  const adminMessage = `Hi, I just booked a session on CoachNow and I'd like to pay.\n\nCoach: ${coach.name}\nSport: ${coach.sportType}\nPlan: ${packageLabel}\nDate: ${date}\n${packageType === 'session' ? `Time: ${time ? formatTime(time) : ''}\nDuration: ${coach.sessionDuration} min\n` : `Preferred slots: ${preferredSlotsText}\nValid until: ${planExpiresAt || ''}\n`}${discountApplies ? `Session price: AED ${originalPrice} - ${discountLabel} = AED ${finalPrice}\n` : `Session price: AED ${finalPrice}\n`}Service fee: AED ${serviceFee}\nVAT (5%): AED ${vatAmount}\n${creditApplied > 0 ? `Subtotal: AED ${totalCharged}\nCredit applied: -AED ${creditApplied}\n` : ''}Total to pay: AED ${amountDueNow}`;

  const coachMessage = currentUser
    ? `Hi ${coach.name}, ${currentUser.name} just ${packageType === 'session' ? 'booked a session' : 'enrolled in your group training'} with you on CoachNow 🎉\n\nSport: ${coach.sportType}\nPlan: ${packageLabel}\nDate: ${date ? new Date(date).toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}\n${packageType === 'session' ? `Time: ${time ? formatTime(time) : ''}\nDuration: ${coach.sessionDuration} min\n` : `Preferred slots: ${preferredSlotsText}\nValid until: ${planExpiresAt || ''}\n`}${finalTrainingAddress ? `${trainingMode === 'at_academy' ? 'Location' : 'Customer address'}: ${finalTrainingAddress}\n` : ''}\nPlease accept or decline this request from your CoachNow dashboard.`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    if (!date) { setError('Please select a date.'); return; }
    if (!isDayAvailable) { setError(`${coach.name} isn't available on ${selectedDayName}s. Please pick one of their available days.`); return; }
    if (packageType === 'session' && !time) { setError('Please select a time slot.'); return; }
    if (packageType !== 'session' && preferredSlots.length === 0) { setError('Please select at least one preferred weekly slot.'); return; }
    setLoading(true); setError('');
    try {
      // Snapshot everything now, while the discount calculation is still
      // correct — addBooking below is what makes it incorrect for any
      // *subsequent* render of this page.
      const summary = {
        discountApplies, originalPrice, discountAmount, discountLabel,
        finalPrice, serviceFee, vatAmount, creditApplied, amountDueNow,
        adminMessage, coachMessage, planExpiresAt, preferredSlots,
      };

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
        trainingMode,
        ...(finalTrainingAddress.trim() ? { trainingAddress: finalTrainingAddress.trim() } : {}),
        ...(packageType !== 'session' ? { packageType } : {}),
        ...(selectedPlan ? { sessionsIncluded: selectedPlan.sessionsIncluded, ...(selectedPlan.freeSessions ? { freeSessions: selectedPlan.freeSessions } : {}) } : {}),
        ...(planExpiresAt ? { planExpiresAt } : {}),
        ...(preferredSlots.length > 0 ? { preferredSlots } : {}),
        ...(creditApplied > 0 ? { creditApplied } : {}),
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
      if (creditApplied > 0 && currentUser) {
        await updateDoc(doc(db, 'users', currentUser.id), { creditBalance: creditAvailable - creditApplied });
      }

      // Fire-and-forget — a confirmation email is a nice-to-have on top of
      // the booking itself, so a hiccup here should never block or undo
      // the actual booking that just succeeded.
      fetch('/api/booking-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: {
            parentName: currentUser?.name,
            parentEmail: currentUser?.email,
            coachName: coach.name,
            sportType: coach.sportType,
            date,
            time,
            duration: coach.sessionDuration,
          },
        }),
      }).catch((err) => console.warn('Booking confirmation email could not be sent:', err));

      setConfirmedSummary(summary);
      setSuccess(true);
    } catch (err) {
      console.error('Booking failed:', err);
      setError('Booking failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success && confirmedSummary) {
    const {
      discountApplies: confirmedDiscountApplies, originalPrice: confirmedOriginalPrice,
      discountAmount: confirmedDiscountAmount, discountLabel: confirmedDiscountLabel,
      finalPrice: confirmedFinalPrice, serviceFee: confirmedServiceFee, vatAmount: confirmedVatAmount,
      creditApplied: confirmedCreditApplied, amountDueNow: confirmedAmountDueNow,
      adminMessage: confirmedAdminMessage, coachMessage: confirmedCoachMessage,
      planExpiresAt: confirmedPlanExpiresAt, preferredSlots: confirmedPreferredSlots,
    } = confirmedSummary;
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
                <span className="text-gray-500">Academy</span>
                <span className="font-semibold text-gray-800">{coach.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{packageType === 'session' ? 'Date' : 'Start Date'}</span>
                <span className="font-semibold text-gray-800">{new Date(date).toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              {packageType === 'session' ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Time</span>
                    <span className="font-semibold text-gray-800">{formatTime(time)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-semibold text-gray-800">{coach.sessionDuration} minutes</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Preferred slots</span>
                    <span className="font-semibold text-gray-800 text-right">
                      {confirmedPreferredSlots.map((s) => `${s.day} ${formatTime(s.time)}`).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Valid until</span>
                    <span className="font-semibold text-gray-800">
                      {confirmedPlanExpiresAt && new Date(confirmedPlanExpiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      <span className="text-gray-400 font-normal"> ({packageType === 'month' ? '30 days' : '90 days'})</span>
                    </span>
                  </div>
                </>
              )}
              {confirmedDiscountApplies && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Original price</span>
                    <span className="text-gray-400 line-through">AED {confirmedOriginalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">{confirmedDiscountLabel}</span>
                    <span className="font-semibold text-emerald-600">- AED {confirmedDiscountAmount}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Session price</span>
                <span className="font-semibold text-gray-800">AED {confirmedFinalPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service fee</span>
                <span className="font-semibold text-gray-800">AED {confirmedServiceFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (5%)</span>
                <span className="font-semibold text-gray-800">AED {confirmedVatAmount}</span>
              </div>
              {confirmedCreditApplied > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Credit applied</span>
                  <span className="font-semibold text-emerald-600">- AED {confirmedCreditApplied}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-800 font-semibold">Total to pay</span>
                <span className="font-bold text-blue-600">AED {confirmedAmountDueNow}</span>
              </div>
            </div>

            <a
              href={buildAdminWhatsAppLink(confirmedAdminMessage)}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold rounded-xl py-3.5 text-sm transition-colors mb-3"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp to Pay
            </a>

            {coach.phone && (
              <a
                href={buildWhatsAppLink(coach.phone, confirmedCoachMessage)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#1ebe5a] hover:bg-green-50 font-bold rounded-xl py-3.5 text-sm transition-colors mb-3"
              >
                <MessageCircle className="w-5 h-5" />
                Notify {coach.name.split(' ')[0]} on WhatsApp
              </a>
            )}

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => navigate('/coaches')}>
                Find More Academies
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

        <h1 className="text-2xl font-black text-gray-900 mb-6">
          {packageType === 'session' ? 'Book a Session' : 'Enroll in Group Training'}
        </h1>

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

              {/* Package Type */}
              {(coach.monthlyPlan || coach.termPlan) && (
                <Card>
                  <h2 className="font-bold text-gray-900 mb-1">Choose Your Plan</h2>
                  <p className="text-xs text-gray-400 mb-3">Private 1-to-1 coaching, or group training with other kids.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPackageType('session')}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        packageType === 'session' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">Private 1-to-1</p>
                      <p className="text-xs text-gray-500 mt-0.5">AED {coach.pricePerHour} / session</p>
                    </button>
                    {coach.monthlyPlan && (
                      <button
                        type="button"
                        onClick={() => setPackageType('month')}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${
                          packageType === 'month' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm font-bold text-gray-900">Group · Monthly</p>
                        <p className="text-xs text-gray-500 mt-0.5">AED {coach.monthlyPlan.price} · {coach.monthlyPlan.sessionsIncluded} sessions</p>
                        {!!coach.monthlyPlan.freeSessions && (
                          <p className="text-xs text-emerald-600 font-semibold mt-0.5">+{coach.monthlyPlan.freeSessions} free</p>
                        )}
                      </button>
                    )}
                    {coach.termPlan && (
                      <button
                        type="button"
                        onClick={() => setPackageType('term')}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${
                          packageType === 'term' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm font-bold text-gray-900">Group · 3-Month Term</p>
                        <p className="text-xs text-gray-500 mt-0.5">AED {coach.termPlan.price} · {coach.termPlan.sessionsIncluded} sessions</p>
                        {!!coach.termPlan.freeSessions && (
                          <p className="text-xs text-emerald-600 font-semibold mt-0.5">+{coach.termPlan.freeSessions} free</p>
                        )}
                      </button>
                    )}
                  </div>
                  {selectedPlan && (
                    <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg px-3 py-2">
                      {selectedPlan.sessionsIncluded}{selectedPlan.freeSessions ? ` + ${selectedPlan.freeSessions} free` : ''} sessions for
                      AED {selectedPlan.price} — works out to about AED {Math.round(selectedPlan.price / (selectedPlan.sessionsIncluded + (selectedPlan.freeSessions || 0)))}/session.
                    </p>
                  )}
                  {packageType !== 'session' && (
                    <p className="text-xs text-gray-400 mt-3">
                      Pick a start date below — {coach.name} will confirm your full schedule with you directly
                      once your package is set up.
                    </p>
                  )}
                </Card>
              )}

              {/* Date */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {packageType === 'session' ? 'Select Date' : 'Preferred Start Date'}
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
                    {coach.name} doesn't coach on {selectedDayName}s. Available days: {workingDays.join(', ')}.
                  </p>
                )}
                {packageType !== 'session' && planExpiresAt && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2 font-medium">
                    This {packageType === 'month' ? 'monthly plan' : 'term plan'} runs for {packageType === 'month' ? '30' : '90'} days
                    — valid through {new Date(planExpiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {coach.name.split(' ')[0]} coaches on {workingDays.join(', ')}.
                </p>
              </Card>

              {/* Time — private sessions only. */}
              {packageType === 'session' && (
                <Card>
                  <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Select Time
                  </h2>
                  <p className="text-xs text-gray-400 mb-3">
                    {dayBlocks && dayBlocks.length > 0
                      ? `Available ${dayBlocks.map(b => `${formatTime(b.start)}–${formatTime(b.end)}`).join(', ')} on ${selectedDayName}`
                      : 'Pick a date above to see available times'}
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
              )}

              {/* Preferred weekly slots — group plans only. The customer
                  picks which recurring weekly time(s) they intend to
                  attend; the academy confirms the exact schedule with them
                  once the package is set up. */}
              {packageType !== 'session' && (
                <Card>
                  <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Preferred Weekly Slots
                  </h2>
                  <p className="text-xs text-gray-400 mb-3">
                    Pick the day(s) and time(s) you'd like to attend regularly. {coach.name.split(' ')[0]} will confirm your exact schedule.
                  </p>
                  <div className="space-y-3">
                    {workingDays.map((day) => {
                      const options = weeklySlotOptions.filter((s) => s.day === day);
                      if (options.length === 0) return null;
                      return (
                        <div key={day}>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">{day}</p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {options.map(({ time: t }) => {
                              const key = `${day}|${t}`;
                              const isSelected = preferredSlotKeys.includes(key);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => togglePreferredSlot(day, t)}
                                  className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                >
                                  {formatTime(t)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {preferredSlots.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                      {preferredSlots.map((s) => (
                        <span
                          key={`${s.day}|${s.time}`}
                          className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                        >
                          {s.day} {formatTime(s.time)}
                          <button
                            type="button"
                            onClick={() => togglePreferredSlot(s.day, s.time)}
                            className="text-blue-400 hover:text-blue-700"
                            aria-label={`Remove ${s.day} ${formatTime(s.time)}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              )}

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
                    <p className="text-xs text-gray-500 mt-0.5">Academy's primary training location. Exact address shared after confirmation.</p>
                  </div>
                </div>
              </Card>

              {/* Training Location */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Training Location
                </h2>

                {normalizedLocations.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <button
                      type="button"
                      onClick={() => setTrainingMode('at_academy')}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        trainingMode === 'at_academy' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">At {coach.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Train at their facility</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrainingMode('at_home')}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        trainingMode === 'at_home' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">At My Location</p>
                      <p className="text-xs text-gray-500 mt-0.5">They come to you</p>
                    </button>
                  </div>
                )}

                {trainingMode === 'at_academy' && normalizedLocations.length > 0 ? (
                  <div className="space-y-2">
                    {normalizedLocations.length > 1 && (
                      <p className="text-xs text-gray-400 mb-1">Pick whichever branch is closest to you:</p>
                    )}
                    {normalizedLocations.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedLocationIndex(i)}
                        className={`w-full flex items-start gap-2.5 text-left p-3 rounded-xl border-2 transition-all ${
                          selectedLocationIndex === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700">{formatAcademyLocation(loc)}</p>
                          <a
                            href={buildMapLink(buildAcademyLocationSearchText(loc))}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            View on map →
                          </a>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mb-2">
                      {coach.name.split(' ')[0]} comes to you — for the most accurate directions, open Google Maps,
                      find your exact location, tap <strong>Share</strong>, then <strong>Copy link</strong> and paste
                      it below. A typed address works too if that's easier.
                      {currentUser?.homeAddress && ' Pre-filled from your saved address — edit it if this session is somewhere else.'}
                    </p>
                    <textarea
                      placeholder="Paste your Google Maps link, or type your address (e.g. Villa 12, Street 4, Al Barsha, Dubai)"
                      value={trainingAddress}
                      onChange={e => setTrainingAddress(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    />
                    {isMapLink(trainingAddress) && (
                      <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Maps link detected — {coach.name.split(' ')[0]} will see your exact pin.
                      </p>
                    )}
                  </>
                )}
              </Card>

              {/* Notes */}
              <Card>
                <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Session Notes (Optional)
                </h2>
                <textarea
                  placeholder="Tell the academy about your goals, skill level, age, or any special requirements..."
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

              <Button type="submit" fullWidth size="lg" loading={loading} disabled={!isDayAvailable || (packageType !== 'session' && preferredSlots.length === 0)}>
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
                {packageType === 'session' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium text-gray-800">{time ? formatTime(time) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-800">{coach.sessionDuration} minutes</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Slots</span>
                      <span className="font-medium text-gray-800 text-right">
                        {preferredSlots.length > 0 ? preferredSlots.map((s) => `${s.day} ${formatTime(s.time)}`).join(', ') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valid until</span>
                      <span className="font-medium text-gray-800">
                        {planExpiresAt ? new Date(planExpiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </>
                )}
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
                  {creditAvailable > 0 && (
                    <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCredit}
                        onChange={(e) => setUseCredit(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Use my AED {creditAvailable} credit
                      </span>
                    </label>
                  )}
                  {creditApplied > 0 && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-emerald-600">Credit applied</span>
                      <span className="font-medium text-emerald-600">- AED {creditApplied}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                    <span className="text-gray-800">Total to pay</span>
                    <span className="text-blue-600">AED {amountDueNow}</span>
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
