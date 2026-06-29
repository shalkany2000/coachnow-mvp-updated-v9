import { useState } from 'react';
import { Calendar, Clock, MapPin, DollarSign, ChevronRight, Receipt, XCircle, Navigation } from 'lucide-react';
import { Booking } from '../../lib/mockData';
import { formatTime } from '../../utils/time';
import { buildMapLink } from '../../lib/config';
import { ReceiptModal } from '../ReceiptModal';
import { CancelBookingModal } from '../CancelBookingModal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface BookingCardProps {
  booking: Booking;
  role: 'parent' | 'coach' | 'admin';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
}

const statusConfig = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  accepted: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
  completed: { label: 'Completed', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export function BookingCard({ booking, role, onAccept, onReject, onComplete, onMarkPaid }: BookingCardProps) {
  const status = statusConfig[booking.status];
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const isUpcoming = (booking.status === 'pending' || booking.status === 'accepted')
    && new Date(`${booking.date}T${booking.time}:00`).getTime() > Date.now();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Card className="flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
              booking.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {booking.paid ? 'Paid' : 'Unpaid'}
            </span>
            {booking.packageType && booking.packageType !== 'session' && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                {booking.packageType === 'month' ? 'Monthly' : '3-Month Term'}
                {booking.sessionsIncluded ? ` · ${booking.sessionsIncluded}${booking.freeSessions ? `+${booking.freeSessions}` : ''} sessions` : ''}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-base">
            {role === 'parent' ? booking.coachName : booking.parentName}
          </h3>
          <p className="text-sm text-blue-600 font-medium">{booking.sportType}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">AED {booking.price}</p>
          <p className="text-xs text-gray-500">Session fee</p>
          {(booking.serviceFee || booking.vatAmount) && (
            <p className="text-xs text-gray-400 mt-0.5">
              Total paid: AED {booking.price + (booking.serviceFee || 0) + (booking.vatAmount || 0)}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{formatDate(booking.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{formatTime(booking.time)} · {booking.duration} min</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{booking.location}</span>
        </div>
        {booking.trainingAddress && (
          <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg px-2.5 py-2 -mx-0.5">
            <Navigation className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="block">{booking.trainingAddress}</span>
              <a
                href={buildMapLink(booking.trainingAddress)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View on map →
              </a>
            </div>
          </div>
        )}
        {(role === 'coach' || role === 'admin') && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>
              {role === 'coach'
                ? `You earn: AED ${booking.coachEarnings}`
                : `Commission: AED ${booking.commission}`}
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-500 mb-0.5 font-medium">Notes</p>
          <p className="text-sm text-gray-700">{booking.notes}</p>
        </div>
      )}

      {/* Invoice */}
      {booking.invoiceNumber && (
        <div className="flex items-center justify-between gap-3 bg-blue-50 rounded-xl px-3 py-2.5">
          <span className="text-sm font-medium text-blue-700">Invoice {booking.invoiceNumber}</span>
          <button
            onClick={() => setShowReceipt(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            <Receipt className="w-3.5 h-3.5" />
            View Receipt
          </button>
        </div>
      )}
      {showReceipt && <ReceiptModal booking={booking} onClose={() => setShowReceipt(false)} />}

      {role === 'parent' && isUpcoming && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors py-1"
        >
          <XCircle className="w-4 h-4" />
          Cancel or Reschedule
        </button>
      )}
      {showCancelModal && <CancelBookingModal booking={booking} onClose={() => setShowCancelModal(false)} />}

      {/* Actions */}
      {role === 'coach' && booking.status === 'pending' && (
        <div className="flex gap-3 pt-1">
          <Button variant="danger" size="sm" fullWidth onClick={() => onReject?.(booking.id)}>
            Decline
          </Button>
          <Button variant="secondary" size="sm" fullWidth onClick={() => onAccept?.(booking.id)}>
            Accept
          </Button>
        </div>
      )}
      {role === 'coach' && booking.status === 'accepted' && (
        <Button variant="outline" size="sm" fullWidth onClick={() => onComplete?.(booking.id)}>
          Mark as Completed
        </Button>
      )}
      {role === 'admin' && (
        <div className="space-y-3">
          {!booking.paid && (booking.status === 'accepted' || booking.status === 'completed') && (
            <Button variant="secondary" size="sm" fullWidth onClick={() => onMarkPaid?.(booking.id)}>
              Mark as Paid
            </Button>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs text-gray-500">
            <span>Booking ID: #{booking.id.slice(-6)}</span>
            <span className="flex items-center gap-1">Commission: AED {booking.commission} <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>
      )}
    </Card>
  );
}
