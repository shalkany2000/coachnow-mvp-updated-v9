// Generates a short, shareable referral code from a person's name plus a
// random suffix, e.g. "SARA42K" — memorable enough to say out loud, random
// enough to avoid collisions in practice.
export function generateReferralCode(name: string): string {
  const namePart = (name || 'FRIEND')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'FRND';
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${namePart}${randomPart}`;
}

export function buildReferralLink(code: string): string {
  return `${window.location.origin}/register?ref=${code}`;
}
