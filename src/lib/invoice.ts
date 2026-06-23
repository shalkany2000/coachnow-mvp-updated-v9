import { Booking } from './mockData';

interface InvoiceBookingData {
  parentName: string;
  parentEmail: string;
  coachName: string;
  sportType: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  price: number;
}

function toInvoiceBookingData(booking: Booking): InvoiceBookingData {
  return {
    parentName: booking.parentName,
    parentEmail: booking.parentEmail,
    coachName: booking.coachName,
    sportType: booking.sportType,
    date: booking.date,
    time: booking.time,
    duration: booking.duration,
    location: booking.location,
    price: booking.price,
  };
}

// Fire-and-forget — emailing the invoice is a nice-to-have on top of the
// "mark as paid" action itself, so a hiccup here (e.g. RESEND_API_KEY not
// configured yet) should never block or undo the actual payment confirmation.
export function emailInvoice(invoiceNumber: string, booking: Booking): void {
  fetch('/api/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'email',
      invoiceNumber,
      booking: toInvoiceBookingData(booking),
    }),
  }).catch(err => {
    console.warn('Invoice email could not be sent:', err);
  });
}

// Downloads the invoice PDF directly in the browser — regenerated fresh on
// every click rather than fetched from storage, since nothing is ever saved
// server-side.
export async function downloadInvoice(invoiceNumber: string, booking: Booking): Promise<void> {
  const response = await fetch('/api/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'download',
      invoiceNumber,
      booking: toInvoiceBookingData(booking),
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to generate invoice');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
