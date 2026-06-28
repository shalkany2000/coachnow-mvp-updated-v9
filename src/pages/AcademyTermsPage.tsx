import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function AcademyTermsPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const commissionPercent = Math.round(settings.commissionRate * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Academy & Gym Partner Terms</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-400 text-xs">Last updated: {new Date().toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p>
            These terms apply to any academy, gym, club, or facility ("Partner") that creates a listing on CoachNow
            to offer coaching sessions, classes, or facility bookings to customers ("Customers"). By completing
            registration and creating a Partner profile, you agree to the terms below.
          </p>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. What CoachNow Is</h2>
            <p>
              CoachNow is a booking marketplace connecting Customers with independent academies, gyms, and sports
              facilities across the UAE. CoachNow is not a party to the coaching or facility-rental relationship
              between you and your Customers — you remain solely responsible for the quality, safety, and delivery
              of any session, class, or facility access you offer.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. Your Listing</h2>
            <p>
              You're responsible for the accuracy of everything in your profile — pricing, schedule, sport type,
              location, and description. Pricing shown to Customers may include a platform service fee and VAT in
              addition to your listed session price; these are calculated automatically and do not reduce your
              earnings on a session unless a discount you're responsible for funding applies (see Section 4).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. Commission</h2>
            <p>
              CoachNow currently takes a <strong>{commissionPercent}% commission</strong> on the session price of
              each completed, paid booking. This rate is set in your dashboard and may be updated by CoachNow from
              time to time; any change will apply only to bookings made after the change takes effect, not
              retroactively.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. Discounts & Promotions</h2>
            <p>
              CoachNow may run platform-wide promotions (such as a first-booking discount for new Customers). Where
              a discount is funded by you, it reduces your earnings on that specific booking; where it's funded by
              the platform, it reduces CoachNow's commission instead — never both. Current settings are visible in
              your dashboard.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. Payments</h2>
            <p>
              Customer payments are currently coordinated manually via WhatsApp and confirmed by CoachNow staff.
              You will be paid your share of completed, paid bookings according to the payout schedule communicated
              to you separately. You're responsible for your own tax obligations, including VAT registration if
              applicable to your business.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">6. Cancellations & Rescheduling</h2>
            <p>
              Customers may cancel a booking for credit, or reschedule without penalty, according to the
              cancellation policy configured in CoachNow's settings (visible to Customers at the time of booking).
              You agree to honor confirmed bookings and to communicate promptly with Customers and CoachNow if you
              need to cancel or reschedule a session on your end.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">7. Verification</h2>
            <p>
              CoachNow may request a trade license, relevant certifications, or other documentation before marking
              your profile as "Verified." Operating without completing verification is permitted, but your listing
              may show as unverified to Customers until this is complete.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">8. Conduct & Safety</h2>
            <p>
              You agree to maintain a safe environment for all Customers, including minors, and to comply with all
              applicable UAE laws and regulations governing your facility or coaching activity. CoachNow reserves
              the right to suspend or remove any listing that violates these terms or poses a safety concern.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">9. Termination</h2>
            <p>
              You may deactivate your listing at any time. CoachNow may suspend or remove your listing for
              violations of these terms, repeated Customer complaints, or failure to complete verification within a
              reasonable period after request.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">10. Changes to These Terms</h2>
            <p>
              CoachNow may update these terms from time to time. Continuing to operate your listing after an update
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            Questions about these terms? Contact us via the WhatsApp link in your dashboard or at hello@coachnow.ae.
          </p>
        </div>
      </div>
    </div>
  );
}
