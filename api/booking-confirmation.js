// Vercel serverless function — sends a booking confirmation email to the
// parent the moment they book. Mirrors the same graceful-skip pattern as
// the rest of this app's optional integrations: if RESEND_API_KEY isn't
// set yet, this just does nothing rather than failing the booking itself.
//
// REQUIRED SETUP:
//   Vercel project -> Settings -> Environment Variables:
//     RESEND_API_KEY = re_xxxxxxxxxxxx

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { booking } = req.body;
    if (!booking || !booking.parentEmail) {
      return res.status(400).json({ error: 'Missing booking details or parent email' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
        <h2 style="color:#2563eb;">Booking request sent! 🎉</h2>
        <p style="color:#374151;line-height:1.5;">
          Hi ${booking.parentName}, your booking request with <strong>${booking.coachName}</strong> has been sent.
          You'll get another update once they accept or decline.
        </p>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="margin:4px 0;"><strong>Sport:</strong> ${booking.sportType}</p>
          <p style="margin:4px 0;"><strong>Date:</strong> ${formatDate(booking.date)}</p>
          <p style="margin:4px 0;"><strong>Time:</strong> ${formatTime(booking.time)}</p>
          <p style="margin:4px 0;"><strong>Duration:</strong> ${booking.duration} minutes</p>
        </div>
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
        subject: `Booking request sent to ${booking.coachName} — CoachNow`,
        html,
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
