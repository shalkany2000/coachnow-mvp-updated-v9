// ─── EDIT THIS BEFORE LAUNCH ────────────────────────────────────────────
// After a client books a session, they're sent to WhatsApp to chat with
// the admin, who sends them a payment link. Replace this with your real
// WhatsApp number: country code + number, no +, no spaces, no leading 0.
// Example real UAE number: 971501234567

export const ADMIN_WHATSAPP_NUMBER = '971524063518';

// UAE standard VAT rate. Applied to (session price + service fee).
export const VAT_RATE = 0.05;

// Flat platform service fee added to every booking, in AED. Kept entirely
// by the platform — not split with the coach, same as how Uber/Airbnb
// service fees work.
export const SERVICE_FEE_AED = 7;

// The referral reward is still a percentage of the session price (set in
// Admin Settings), but capped at this flat amount regardless — keeps the
// program's cost predictable even on a high-value session/package.
export const REFERRAL_DISCOUNT_CAP_AED = 35;

// If the customer pasted a real Google Maps link (the kind you get from
// tapping "Share" on a pinned location in the Maps app), this is true —
// and that link should be used directly rather than re-wrapped in a text
// search, since it points to their exact pin, not just a guess from typed
// text.
export function isMapLink(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.startsWith('http://') || v.startsWith('https://');
}

// Resolves whatever a customer put in their address field into something
// clickable: their own pasted Maps link, used as-is (most precise), or a
// plain typed address, wrapped in a Maps text search (still works, just
// less precise than an actual dropped pin).
export function buildMapLink(addressOrLink: string): string {
  if (isMapLink(addressOrLink)) return addressOrLink.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrLink)}`;
}

export function buildAdminWhatsAppLink(message: string): string {
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Builds a wa.me link to any phone number — used to let a parent notify
// their coach directly, for example. Strips everything but digits and a
// leading 0 (common in local-format numbers), since wa.me needs the
// number with country code and no other formatting.
export function buildWhatsAppLink(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '971' + digits.slice(1); // assume UAE local format
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
