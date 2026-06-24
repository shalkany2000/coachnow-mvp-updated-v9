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
