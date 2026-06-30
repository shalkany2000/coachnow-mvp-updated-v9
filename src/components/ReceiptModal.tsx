import { X, CheckCircle2 } from 'lucide-react';
import { Booking } from '../lib/mockData';
import { formatTime } from '../utils/time';

interface ReceiptModalProps {
  booking: Booking;
  onClose: () => void;
}

export function ReceiptModal({ booking, onClose }: ReceiptModalProps) {
  const sessionDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-AE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const serviceFee = booking.serviceFee || 0;
  const vatAmount = booking.vatAmount || 0;
  const totalPaid = booking.price + serviceFee + vatAmount;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full relative max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Branded header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-t-2xl px-6 pt-6 pb-6 text-center relative">
          <button
            onClick={onClose}
            aria-label="Close receipt"
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2 p-1.5">
            <img src="/images/logo-icon.png" alt="" className="w-full h-full object-contain" />
          </div>
          <p className="font-bold text-white text-lg">CoachNow</p>
          <p className="text-blue-100 text-xs mt-0.5">Dubai, United Arab Emirates</p>
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 mt-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-xs font-bold text-white tracking-wide">PAID</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <h3 className="font-bold text-center text-gray-900 text-base mb-4">Payment Receipt</h3>

          {/* Meta */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No.</span>
              <span className="font-semibold text-gray-900">{booking.invoiceNumber}</span>
            </div>
            {booking.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Paid on</span>
                <span className="text-gray-700">
                  {new Date(booking.paidAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Billed to</span>
              <span className="text-gray-700">{booking.parentName}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 my-4" />

          {/* Session details */}
          <p className="text-xs font-bold text-gray-400 tracking-wide mb-2">SESSION DETAILS</p>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="font-semibold text-gray-900">{booking.sportType} with {booking.coachName}</p>
            <p className="text-sm text-gray-500 mt-1">{sessionDate}</p>
            {booking.packageType && booking.packageType !== 'session' ? (
              <>
                {booking.planExpiresAt && (
                  <p className="text-sm text-gray-500">
                    Valid until {new Date(booking.planExpiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                {booking.preferredSlots && booking.preferredSlots.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {booking.preferredSlots.map((s) => `${s.day} ${formatTime(s.time)}`).join(', ')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">{formatTime(booking.time)} · {booking.duration} min</p>
            )}
            <p className="text-sm text-gray-500">{booking.location}</p>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 my-4" />

          {/* Itemized totals */}
          <p className="text-xs font-bold text-gray-400 tracking-wide mb-2">PAYMENT BREAKDOWN</p>
          <div className="space-y-1.5 text-sm">
            {booking.discountAmount ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-400 line-through">AED {booking.originalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">{booking.discountReason || 'Discount'}</span>
                  <span className="font-medium text-emerald-600">- AED {booking.discountAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Session price</span>
                  <span className="text-gray-700">AED {booking.price}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-500">Session price</span>
                <span className="text-gray-700">AED {booking.price}</span>
              </div>
            )}
            {serviceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Service fee</span>
                <span className="text-gray-700">AED {serviceFee}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">VAT (5%)</span>
                <span className="text-gray-700">AED {vatAmount}</span>
              </div>
            )}
          </div>

          {/* Grand total */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 mt-3 flex items-center justify-between">
            <span className="font-bold text-gray-900">Total Paid</span>
            <span className="font-black text-blue-600 text-lg">AED {totalPaid}</span>
          </div>

          <p className="text-xs text-gray-400 text-center mt-5">
            Thank you for booking with CoachNow.
          </p>
        </div>
      </div>
    </div>
  );
}
