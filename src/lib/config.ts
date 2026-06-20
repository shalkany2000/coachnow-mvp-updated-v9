// ─── EDIT THIS BEFORE LAUNCH ────────────────────────────────────────────
// After a client books a session, they're sent to WhatsApp to chat with
// the admin, who sends them a payment link. Replace this with your real
// WhatsApp number: country code + number, no +, no spaces, no leading 0.
// Example real UAE number: 971501234567

export const ADMIN_WHATSAPP_NUMBER = '971524063518';

export function buildAdminWhatsAppLink(message: string): string {
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
