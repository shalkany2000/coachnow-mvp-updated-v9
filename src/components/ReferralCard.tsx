import { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { buildReferralLink } from '../lib/referral';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export function ReferralCard() {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);

  if (!currentUser?.referralCode || !settings.referralProgramEnabled) return null;

  const link = buildReferralLink(currentUser.referralCode);
  const hasReward = !!currentUser.pendingReferralDiscountPercent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (older browsers, permissions) — the
      // visible link text is still there for them to copy manually.
    }
  };

  const whatsappMessage = `Hey! I've been booking sports coaches in Dubai through CoachNow — here's my referral link, sign up with it: ${link}`;

  return (
    <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Refer a Friend, Earn {settings.referralDiscountPercent}% Off</h3>
            <p className="text-pink-100 text-sm mt-0.5">
              Share your code — when they book their first session, you get {settings.referralDiscountPercent}% off your next one.
            </p>
          </div>
        </div>
      </div>

      {hasReward && (
        <div className="bg-white/15 rounded-xl px-3 py-2 mt-3 text-sm font-semibold">
          🎁 You've got a {currentUser.pendingReferralDiscountPercent}% reward ready — it'll apply automatically on your next booking!
        </div>
      )}

      <div className="bg-white/15 rounded-xl px-4 py-3 mt-3 flex items-center justify-between gap-3">
        <span className="font-mono font-bold tracking-wider text-lg">{currentUser.referralCode}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noreferrer"
        className="block w-full mt-3"
      >
        <Button fullWidth className="bg-white text-pink-600 hover:bg-pink-50">
          Share on WhatsApp
        </Button>
      </a>
    </Card>
  );
}
