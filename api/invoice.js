// Vercel serverless function — generates a real PDF invoice on demand
// (never stored anywhere) and either:
//   - emails it as an attachment via Resend, or
//   - streams it straight back to the browser for download.
//
// REQUIRED SETUP for email delivery (download mode works without this):
//   Vercel project -> Settings -> Environment Variables:
//     RESEND_API_KEY = re_xxxxxxxxxxxx
// Until that's set, email sending is skipped gracefully (download still works).

import PDFDocument from 'pdfkit';

const FROM_ADDRESS = 'CoachNow <onboarding@resend.dev>';

function formatTime(time) {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Builds the invoice PDF as an in-memory buffer — nothing touches disk or
// any storage bucket, so this works on Firebase's free Spark plan with no
// Cloud Storage dependency.
function buildInvoicePdf({ invoiceNumber, booking }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const blue = '#2563eb';
    const gray = '#6b7280';
    const dark = '#111827';

    // Header
    doc.fillColor(blue).fontSize(24).font('Helvetica-Bold').text('CoachNow', 50, 50);
    doc.fillColor(gray).fontSize(10).font('Helvetica').text('Dubai, United Arab Emirates', 50, 80);
    doc.fillColor(dark).fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fillColor(gray).fontSize(11).font('Helvetica').text(invoiceNumber, 400, 78, { align: 'right' });

    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e5e7eb').stroke();

    // Bill to / details
    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('BILLED TO', 50, 130);
    doc.fillColor(dark).fontSize(11).font('Helvetica').text(booking.parentName, 50, 145);
    if (booking.parentEmail) doc.fillColor(gray).fontSize(10).text(booking.parentEmail, 50, 162);

    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('INVOICE DATE', 350, 130, { width: 195, align: 'right' });
    doc.fillColor(dark).fontSize(11).font('Helvetica').text(
      new Date().toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }),
      350, 145, { width: 195, align: 'right' }
    );
    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('STATUS', 350, 165, { width: 195, align: 'right' });
    doc.fillColor('#059669').fontSize(11).font('Helvetica-Bold').text('PAID', 350, 180, { width: 195, align: 'right' });

    // Session details table
    let y = 230;
    doc.fillColor(dark).fontSize(12).font('Helvetica-Bold').text('Session Details', 50, y);
    y += 25;

    doc.fillColor('#f9fafb').rect(50, y, 495, 26).fill();
    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, y + 8);
    doc.text('DATE & TIME', 280, y + 8);
    doc.text('AMOUNT', 460, y + 8, { width: 75, align: 'right' });
    y += 26;

    doc.fillColor(dark).fontSize(10).font('Helvetica');
    doc.text(`${booking.sportType} session with ${booking.coachName}`, 60, y + 10, { width: 210 });
    doc.fontSize(9).fillColor(gray).text(`${booking.duration} minutes · ${booking.location}`, 60, y + 24, { width: 210 });
    doc.fontSize(10).fillColor(dark).text(formatDate(booking.date), 280, y + 10, { width: 160 });
    doc.fontSize(9).fillColor(gray).text(formatTime(booking.time), 280, y + 24, { width: 160 });
    const lineItemAmount = booking.originalPrice ?? booking.price;
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold').text(`AED ${lineItemAmount}`, 460, y + 10, { width: 75, align: 'right' });
    y += 55;

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
    y += 15;

    // Totals
    doc.fontSize(10).font('Helvetica').fillColor(gray).text('Subtotal', 350, y, { width: 120 });
    doc.fillColor(dark).text(`AED ${lineItemAmount}`, 460, y, { width: 75, align: 'right' });
    y += 20;

    if (booking.discountAmount) {
      doc.fontSize(10).font('Helvetica').fillColor('#059669').text(
        booking.discountReason || 'Discount', 350, y, { width: 120 }
      );
      doc.text(`- AED ${booking.discountAmount}`, 460, y, { width: 75, align: 'right' });
      y += 20;
    }

    doc.fontSize(13).font('Helvetica-Bold').fillColor(dark).text('Total Paid', 350, y, { width: 120 });
    doc.fillColor(blue).text(`AED ${booking.price}`, 460, y, { width: 75, align: 'right' });

    // Footer
    doc.fontSize(8).fillColor(gray).font('Helvetica').text(
      'Thank you for booking with CoachNow. This invoice confirms payment received for the session above.',
      50, 740, { width: 495, align: 'center' }
    );

    doc.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, invoiceNumber, booking } = req.body;
    if (!invoiceNumber || !booking) {
      return res.status(400).json({ error: 'Missing invoiceNumber or booking details' });
    }

    const pdfBuffer = await buildInvoicePdf({ invoiceNumber, booking });

    if (action === 'download') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    // action === 'email'
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Don't break the "mark as paid" flow if email isn't configured yet.
      return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
    }
    if (!booking.parentEmail) {
      return res.status(200).json({ skipped: true, reason: 'No parent email on this booking' });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
        <h2 style="color:#2563eb;">Your invoice is attached 🧾</h2>
        <p style="color:#374151;line-height:1.5;">
          Hi ${booking.parentName}, thanks for your payment. Invoice <strong>${invoiceNumber}</strong>
          for your ${booking.sportType} session with ${booking.coachName} is attached as a PDF.
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CoachNow — Dubai's sports coaching marketplace</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: booking.parentEmail,
        subject: `Invoice ${invoiceNumber} — CoachNow`,
        html,
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBuffer.toString('base64'),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Email provider error', detail: errText });
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
