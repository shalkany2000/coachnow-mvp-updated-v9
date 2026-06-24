import { useState, useEffect } from 'react';
import { Percent, CheckCircle, AlertCircle, Info, Gift, Megaphone, CalendarX } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAdminSidebarItems } from '../../hooks/useAdminSidebarItems';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export function AdminSettings() {
  const { items: sidebarItems, title: sidebarTitle } = useAdminSidebarItems();
  const { settings, updateSettings } = useSettings();

  // Commission
  const [rateInput, setRateInput] = useState(String(Math.round(settings.commissionRate * 100)));
  const [rateLoading, setRateLoading] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  const [rateError, setRateError] = useState('');

  // First-booking discount
  const [discountEnabled, setDiscountEnabled] = useState(settings.firstBookingDiscountEnabled);
  const [discountInput, setDiscountInput] = useState(String(settings.firstBookingDiscountPercent));
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountSaved, setDiscountSaved] = useState(false);
  const [discountError, setDiscountError] = useState('');

  // Announcement
  const [announceEnabled, setAnnounceEnabled] = useState(settings.announcementEnabled);
  const [announceInput, setAnnounceInput] = useState(settings.announcementMessage);
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceSaved, setAnnounceSaved] = useState(false);
  const [announceError, setAnnounceError] = useState('');

  // Referral program
  const [referralEnabled, setReferralEnabled] = useState(settings.referralProgramEnabled);
  const [referralInput, setReferralInput] = useState(String(settings.referralDiscountPercent));
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralSaved, setReferralSaved] = useState(false);
  const [referralError, setReferralError] = useState('');

  // Cancellation policy
  const [fullRefundHoursInput, setFullRefundHoursInput] = useState(String(settings.cancellationFullRefundHours));
  const [partialRefundHoursInput, setPartialRefundHoursInput] = useState(String(settings.cancellationPartialRefundHours));
  const [partialPenaltyInput, setPartialPenaltyInput] = useState(String(settings.cancellationPartialPenaltyPercent));
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [cancellationSaved, setCancellationSaved] = useState(false);
  const [cancellationError, setCancellationError] = useState('');

  useEffect(() => { setRateInput(String(Math.round(settings.commissionRate * 100))); }, [settings.commissionRate]);
  useEffect(() => { setDiscountEnabled(settings.firstBookingDiscountEnabled); }, [settings.firstBookingDiscountEnabled]);
  useEffect(() => { setDiscountInput(String(settings.firstBookingDiscountPercent)); }, [settings.firstBookingDiscountPercent]);
  useEffect(() => { setAnnounceEnabled(settings.announcementEnabled); }, [settings.announcementEnabled]);
  useEffect(() => { setAnnounceInput(settings.announcementMessage); }, [settings.announcementMessage]);
  useEffect(() => { setReferralEnabled(settings.referralProgramEnabled); }, [settings.referralProgramEnabled]);
  useEffect(() => { setReferralInput(String(settings.referralDiscountPercent)); }, [settings.referralDiscountPercent]);
  useEffect(() => { setFullRefundHoursInput(String(settings.cancellationFullRefundHours)); }, [settings.cancellationFullRefundHours]);
  useEffect(() => { setPartialRefundHoursInput(String(settings.cancellationPartialRefundHours)); }, [settings.cancellationPartialRefundHours]);
  useEffect(() => { setPartialPenaltyInput(String(settings.cancellationPartialPenaltyPercent)); }, [settings.cancellationPartialPenaltyPercent]);

  const handleSaveRate = async () => {
    setRateError(''); setRateSaved(false);
    const percent = parseFloat(rateInput);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setRateError('Enter a commission percentage between 0 and 100.');
      return;
    }
    setRateLoading(true);
    try {
      await updateSettings({ commissionRate: percent / 100 });
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save commission rate:', err);
      setRateError("Couldn't save — check your connection and try again.");
    } finally {
      setRateLoading(false);
    }
  };

  const handleSaveDiscount = async () => {
    setDiscountError(''); setDiscountSaved(false);
    const percent = parseFloat(discountInput);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setDiscountError('Enter a discount percentage between 0 and 100.');
      return;
    }
    setDiscountLoading(true);
    try {
      await updateSettings({ firstBookingDiscountEnabled: discountEnabled, firstBookingDiscountPercent: percent });
      setDiscountSaved(true);
      setTimeout(() => setDiscountSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save discount settings:', err);
      setDiscountError("Couldn't save — check your connection and try again.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    setAnnounceError(''); setAnnounceSaved(false);
    setAnnounceLoading(true);
    try {
      await updateSettings({ announcementEnabled: announceEnabled, announcementMessage: announceInput.trim() });
      setAnnounceSaved(true);
      setTimeout(() => setAnnounceSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save announcement:', err);
      setAnnounceError("Couldn't save — check your connection and try again.");
    } finally {
      setAnnounceLoading(false);
    }
  };

  const handleSaveReferral = async () => {
    setReferralError(''); setReferralSaved(false);
    const percent = parseFloat(referralInput);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setReferralError('Enter a reward percentage between 0 and 100.');
      return;
    }
    setReferralLoading(true);
    try {
      await updateSettings({ referralProgramEnabled: referralEnabled, referralDiscountPercent: percent });
      setReferralSaved(true);
      setTimeout(() => setReferralSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save referral settings:', err);
      setReferralError("Couldn't save — check your connection and try again.");
    } finally {
      setReferralLoading(false);
    }
  };

  const handleSaveCancellation = async () => {
    setCancellationError(''); setCancellationSaved(false);
    const fullHours = parseFloat(fullRefundHoursInput);
    const partialHours = parseFloat(partialRefundHoursInput);
    const penalty = parseFloat(partialPenaltyInput);
    if (isNaN(fullHours) || isNaN(partialHours) || isNaN(penalty)) {
      setCancellationError('Enter valid numbers for all three fields.');
      return;
    }
    if (partialHours >= fullHours) {
      setCancellationError('The partial-refund window must be fewer hours than the full-refund window.');
      return;
    }
    if (penalty < 0 || penalty > 100) {
      setCancellationError('Penalty must be between 0 and 100%.');
      return;
    }
    setCancellationLoading(true);
    try {
      await updateSettings({
        cancellationFullRefundHours: fullHours,
        cancellationPartialRefundHours: partialHours,
        cancellationPartialPenaltyPercent: penalty,
      });
      setCancellationSaved(true);
      setTimeout(() => setCancellationSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save cancellation policy:', err);
      setCancellationError("Couldn't save — check your connection and try again.");
    } finally {
      setCancellationLoading(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle={sidebarTitle}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Platform-level settings — only visible to admins.</p>
        </div>

        {/* Commission */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">Platform Commission</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            The cut CoachNow takes from each new booking. Changing this only affects bookings made
            from now on — past bookings keep the rate they were created with.
          </p>

          <label className="text-sm font-medium text-gray-700 block mb-1.5">Commission rate (%)</label>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <span className="text-gray-400 font-medium">%</span>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 mt-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Coaches keep {100 - (parseFloat(rateInput) || 0)}% of each session's price at this rate.
            </p>
          </div>

          {rateError && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-4">
              <AlertCircle className="w-4 h-4" />
              {rateError}
            </div>
          )}
          {rateSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-4">
              <CheckCircle className="w-4 h-4" />
              Saved — new bookings will use the updated rate.
            </div>
          )}

          <Button onClick={handleSaveRate} loading={rateLoading} className="mt-4">
            Save Changes
          </Button>
        </Card>

        {/* First booking discount */}
        <Card>
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900">First Booking Discount</h2>
            </div>
            <Toggle checked={discountEnabled} onChange={() => setDiscountEnabled(!discountEnabled)} />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Automatically applied the moment a parent books for the very first time — no code needed,
            no action from them. It only ever applies once per customer.
          </p>

          <label className="text-sm font-medium text-gray-700 block mb-1.5">Discount (%)</label>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              disabled={!discountEnabled}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <span className="text-gray-400 font-medium">%</span>
          </div>

          {discountError && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-4">
              <AlertCircle className="w-4 h-4" />
              {discountError}
            </div>
          )}
          {discountSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-4">
              <CheckCircle className="w-4 h-4" />
              Saved.
            </div>
          )}

          <Button onClick={handleSaveDiscount} loading={discountLoading} className="mt-4">
            Save Changes
          </Button>
        </Card>

        {/* Homepage announcement */}
        <Card>
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900">Homepage Announcement</h2>
            </div>
            <Toggle checked={announceEnabled} onChange={() => setAnnounceEnabled(!announceEnabled)} />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            A banner shown at the top of the homepage to every visitor. They can dismiss it — it
            reappears for them only if you change the message afterward.
          </p>

          <label className="text-sm font-medium text-gray-700 block mb-1.5">Message</label>
          <textarea
            value={announceInput}
            onChange={(e) => setAnnounceInput(e.target.value)}
            disabled={!announceEnabled}
            rows={2}
            maxLength={140}
            placeholder="e.g. 🎉 New here? Get 50% off your first booking — automatically applied at checkout."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{announceInput.length}/140</p>

          {announceError && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-2">
              <AlertCircle className="w-4 h-4" />
              {announceError}
            </div>
          )}
          {announceSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-2">
              <CheckCircle className="w-4 h-4" />
              Saved — live on the homepage now.
            </div>
          )}

          <Button onClick={handleSaveAnnouncement} loading={announceLoading} className="mt-4">
            Save Changes
          </Button>
        </Card>

        {/* Referral program */}
        <Card>
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              <h2 className="font-bold text-gray-900">Referral Program</h2>
            </div>
            <Toggle checked={referralEnabled} onChange={() => setReferralEnabled(!referralEnabled)} />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            When a customer refers a friend and that friend's first booking is paid for, the
            referrer automatically earns this discount on their next session. Only unlocks once
            real money changes hands — never just for signing up.
          </p>

          <label className="text-sm font-medium text-gray-700 block mb-1.5">Reward (%)</label>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              disabled={!referralEnabled}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <span className="text-gray-400 font-medium">%</span>
          </div>

          {referralError && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-4">
              <AlertCircle className="w-4 h-4" />
              {referralError}
            </div>
          )}
          {referralSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-4">
              <CheckCircle className="w-4 h-4" />
              Saved.
            </div>
          )}

          <Button onClick={handleSaveReferral} loading={referralLoading} className="mt-4">
            Save Changes
          </Button>
        </Card>

        {/* Cancellation policy */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <CalendarX className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-gray-900">Cancellation Policy</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            What a customer gets back as account credit when they cancel, based on how much notice
            they give. Refunds are always issued as credit toward a future booking, never cash.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Full refund window (hours before session)
              </label>
              <input
                type="number" min={1} step={1}
                value={fullRefundHoursInput}
                onChange={(e) => setFullRefundHoursInput(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Cancelling at or before this many hours out: 100% back as credit. Also the only window rescheduling (no penalty) is offered.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Partial refund window (hours before session)
              </label>
              <input
                type="number" min={0} step={1}
                value={partialRefundHoursInput}
                onChange={(e) => setPartialRefundHoursInput(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Between this and the full-refund window: partial credit, minus the penalty below.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Penalty in the partial window (%)</label>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="number" min={0} max={100} step={5}
                  value={partialPenaltyInput}
                  onChange={(e) => setPartialPenaltyInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <span className="text-gray-400 font-medium">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Cancelling inside the partial window forfeits this much; any closer than the partial window forfeits 100%.</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 mt-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              With these numbers: ≥{fullRefundHoursInput}h notice → full credit + free reschedule.
              Between {partialRefundHoursInput}h–{fullRefundHoursInput}h → {100 - (parseFloat(partialPenaltyInput) || 0)}% credit.
              Under {partialRefundHoursInput}h → no credit.
            </p>
          </div>

          {cancellationError && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-4">
              <AlertCircle className="w-4 h-4" />
              {cancellationError}
            </div>
          )}
          {cancellationSaved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-4">
              <CheckCircle className="w-4 h-4" />
              Saved.
            </div>
          )}

          <Button onClick={handleSaveCancellation} loading={cancellationLoading} className="mt-4">
            Save Changes
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
