import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Referral } from './mockData';

// Looks up a user by their referral code — used during registration to
// find who referred this new signup. Returns null if the code doesn't
// match anyone (typo, expired link, etc.) rather than throwing, since a
// bad referral code shouldn't ever block someone from registering.
export async function findReferrerByCode(code: string): Promise<{ id: string; name: string } | null> {
  if (!code.trim()) return null;
  try {
    const q = query(collection(db, 'users'), where('referralCode', '==', code.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const referrerDoc = snap.docs[0];
    return { id: referrerDoc.id, name: (referrerDoc.data().name as string) || 'A friend' };
  } catch (err) {
    console.error('Referral code lookup failed:', err);
    return null;
  }
}

// Records the referral relationship at signup time. The reward itself
// doesn't unlock yet — see processReferralReward, called once the
// referred friend's first booking is actually paid for.
export async function createReferralRecord(
  referrerId: string,
  referrerName: string,
  referredUserId: string,
  referredName: string
): Promise<void> {
  const id = `referral_${referredUserId}`; // one referral record per referred person
  const referral: Referral = {
    id,
    referrerId,
    referrerName,
    referredUserId,
    referredName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'referrals', id), referral);
}

// Called whenever a booking is marked paid. Checks: was this parent
// referred by someone, is this genuinely their first paid booking (not
// just their first booking — someone could have an old unpaid one), and
// is the referral still pending? If all three hold, unlocks the reward on
// the referrer's account and marks the referral as rewarded so it can
// never fire twice for the same person.
export async function processReferralReward(parentId: string, referralDiscountPercent: number): Promise<void> {
  try {
    const userSnap = await getDoc(doc(db, 'users', parentId));
    if (!userSnap.exists()) return;
    const referredBy = userSnap.data().referredBy as string | undefined;
    if (!referredBy) return;

    const referralRef = doc(db, 'referrals', `referral_${parentId}`);
    const referralSnap = await getDoc(referralRef);
    if (!referralSnap.exists() || referralSnap.data().status !== 'pending') return;

    // Is this genuinely the first PAID booking for this parent? If they
    // already have other paid bookings, this isn't the qualifying one —
    // the referral should have already been rewarded (or never will be,
    // if this booking didn't exist yet at the time their actual first
    // paid booking went through).
    const bookingsQuery = query(collection(db, 'bookings'), where('parentId', '==', parentId), where('paid', '==', true));
    const paidBookings = await getDocs(bookingsQuery);
    if (paidBookings.size > 1) return; // not their first paid booking

    await updateDoc(referralRef, { status: 'rewarded', rewardedAt: new Date().toISOString() });
    await updateDoc(doc(db, 'users', referredBy), { pendingReferralDiscountPercent: referralDiscountPercent });
  } catch (err) {
    // Best-effort — a hiccup here shouldn't undo the payment confirmation
    // that triggered it.
    console.error('Failed to process referral reward:', err);
  }
}
