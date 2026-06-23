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

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close receipt"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Payment Receipt</h3>
          <p className="text-xs text-gray-400 mt-0.5">CoachNow · Dubai, UAE</p>
        </div>

        <div className="border-t-2 border-dashed border-gray-200 my-2" />

        {/* Meta */}
        <div className="py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Receipt No.</span>
            <span className="font-semibold text-gray-900">{booking.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="font-bold text-emerald-600">PAID</span>
          </div>
          {booking.paidAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid on</span>
              <span className="text-gray-700">
                {new Date(booking.paidAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-gray-200 my-2" />

        {/* Session details */}
        <div className="py-3">
          <p className="text-xs font-semibold text-gray-400 mb-1.5">SESSION</p>
          <p className="font-semibold text-gray-900">{booking.sportType} with {booking.coachName}</p>
          <p className="text-sm text-gray-500 mt-1">{sessionDate}</p>
          <p className="text-sm text-gray-500">{formatTime(booking.time)} · {booking.duration} min · {booking.location}</p>
          <p className="text-sm text-gray-500 mt-1">Billed to: {booking.parentName}</p>
        </div>

        <div className="border-t-2 border-dashed border-gray-200 my-2" />

        {/* Totals */}
        <div className="py-3 space-y-1.5">
          {booking.discountAmount ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-400 line-through">AED {booking.originalPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">{booking.discountReason || 'Discount'}</span>
                <span className="font-medium text-emerald-600">- AED {booking.discountAmount}</span>
              </div>
            </>
          ) : null}
          <div className="flex justify-between text-lg font-bold pt-1">
            <span className="text-gray-900">Total Paid</span>
            <span className="text-blue-600">AED {booking.price}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Thank you for booking with CoachNow.
        </p>
      </div>
    </div>
  );
}
