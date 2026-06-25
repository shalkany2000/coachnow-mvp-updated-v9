// Notifies the parent by email when a coach accepts or declines their
// booking request. Same graceful-skip pattern: does nothing if
// RESEND_API_KEY isn't configured, never blocks the actual status change.

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
    const { booking, status } = req.body;
    if (!booking || !booking.parentEmail || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Missing booking details, parent email, or invalid status' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
    }

    const isAccepted = status === 'accepted';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
        <h2 style="color:${isAccepted ? '#059669' : '#dc2626'};">
          ${isAccepted ? 'Your session is confirmed! ✅' : 'Update on your booking request'}
        </h2>
        <p style="color:#374151;line-height:1.5;">
          Hi ${booking.parentName}, ${booking.coachName} has
          ${isAccepted ? 'accepted' : "had to decline"} your ${booking.sportType} session request.
        </p>
        ${isAccepted ? `
          <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0;">
            <p style="margin:4px 0;"><strong>Date:</strong> ${formatDate(booking.date)}</p>
            <p style="margin:4px 0;"><strong>Time:</strong> ${formatTime(booking.time)}</p>
          </div>
          <p style="color:#374151;line-height:1.5;">You'll be contacted shortly to arrange payment.</p>
        ` : `
          <p style="color:#374151;line-height:1.5;">No worries — browse other coaches on CoachNow to find another time that works.</p>
        `}
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
        subject: isAccepted ? `${booking.coachName} accepted your booking! — CoachNow` : `Update on your CoachNow booking`,
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
