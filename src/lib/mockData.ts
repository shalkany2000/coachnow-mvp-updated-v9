export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'parent' | 'coach' | 'admin' | 'gm';
  createdAt: string;
  avatar?: string;
  referralCode?: string;
  referredBy?: string; // userId of whoever referred this person, if any
  pendingReferralDiscountPercent?: number; // unlocked reward, applied + cleared on their next booking
  creditBalance?: number; // AED credit from cancellations, usable toward any future booking
  homeAddress?: string; // parent's saved address, so the coach knows where to go for training
  // Only ever explicitly false — present and false means this account was
  // created via Google sign-in and still needs a phone number and a
  // parent/coach choice before it's usable. Absent (the normal case for
  // email/password signups, which always collect both upfront) means complete.
  profileComplete?: boolean;
  termsAcceptedAt?: string; // when an academy/coach signup explicitly accepted the partner terms
}

// Tracks a single referral relationship from signup through reward —
// separate from the User fields above so there's a clean audit trail of
// who referred whom and when the reward actually unlocked.
export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredUserId: string;
  referredName: string;
  status: 'pending' | 'rewarded';
  createdAt: string;
  rewardedAt?: string;
}

// A single working window within a day, e.g. 07:00-11:00. A day can have
// more than one of these — that's how a coach represents "I work mornings
// and evenings but skip the middle of the day."
export interface TimeBlock {
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
}

export const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export type DayKey = typeof DAY_KEYS[number];

// A real verification process instead of one blind toggle — "Verified"
// publicly shown on a coach's profile now means all three of these were
// actually checked off, not just an admin clicking a single button.
export interface VerificationChecklist {
  idVerified: boolean;
  certificationVerified: boolean;
  backgroundCheckCleared: boolean;
  notes?: string; // private, admin-only record of what was checked and when
}

// A package tier - the academy sets the price and how many sessions it
// actually covers (8/month and 24/term are sensible defaults shown in the
// UI, but academies can set whatever real number matches their own
// program). freeSessions are bonus sessions on top, included at no extra
// cost - a common way academies sweeten a package deal.
export interface PricingPlan {
  price: number;
  sessionsIncluded: number;
  freeSessions?: number;
}

// A single physical branch — emirate and area are picked from real,
// curated dropdowns (with "Other" as an escape hatch for an area not in
// the list); addressDetail is optional free text or a pasted Google Maps
// link for the exact building/street, layered on top of the area choice.
export interface AcademyLocation {
  emirate: string;
  area: string; // one of UAE_AREAS_BY_EMIRATE[emirate], or a custom value if "Other" was picked
  addressDetail?: string;
}

// Human-readable display string for a location, e.g. "Dubai Marina, Dubai"
// or, if extra detail was provided, "Dubai Marina, Dubai — Building 4, near the metro".
export function formatAcademyLocation(loc: AcademyLocation): string {
  const base = `${loc.area}, ${loc.emirate}`;
  return loc.addressDetail ? `${base} — ${loc.addressDetail}` : base;
}

// What actually gets opened when a customer taps "View on map" — a pasted
// Maps link or specific address in addressDetail takes priority (most
// precise), falling back to a text search on the area + emirate if no
// extra detail was given.
export function buildAcademyLocationSearchText(loc: AcademyLocation): string {
  return loc.addressDetail || `${loc.area}, ${loc.emirate}, UAE`;
}

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  sportType: string;
  pricePerHour: number; // per-session price - always required, the baseline tier
  monthlyPlan?: PricingPlan | null; // optional monthly package - sessions included is academy-editable, not fixed
  termPlan?: PricingPlan | null; // optional 3-month term package
  isPrivateTraining?: boolean; // shows a "Private 1-to-1 Training" label near the price
  location: string;
  rating: number;
  reviewCount: number;
  bio: string;
  avatar: string; // primary/cover photo
  photos?: string[]; // additional gallery photos, pasted links same as avatar
  locations?: AcademyLocation[]; // physical branches - where customers go for in-person training
  experience: string;
  languages: string[];
  availability: string[];
  availabilityStart: string;
  availabilityEnd: string;
  // Per-day working hours — the real source of truth for which slots a
  // customer can book on a given date. Each day maps to a LIST of time
  // blocks, since a coach might work 07:00-11:00 and then 16:00-20:00 on
  // the same day, skipping the middle. An empty/missing day means a day
  // off. availability/availabilityStart/End above are kept in sync
  // automatically for places that just want a quick "which days, roughly
  // what hours" summary (e.g. coach cards).
  weeklySchedule?: Partial<Record<DayKey, TimeBlock[]>>;
  sessionDuration: number; // minutes
  verified: boolean;
  verificationChecklist?: VerificationChecklist;
  onLeave?: boolean;
}

// Minimal numbering ledger — the actual invoice PDF content is always
// generated fresh from the linked booking's fields, not duplicated here.
// This just exists so invoice numbers are sequential and auditable.
export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-0001"
  bookingId: string;
  parentId: string;
  coachId: string;
  createdAt: string;
}

export interface Review {
  id: string; // same as bookingId — one review per completed booking
  coachId: string;
  bookingId: string;
  parentId: string;
  parentName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  coachId: string;
  coachName: string;
  sportType: string;
  date: string;
  time: string;
  duration: number; // minutes, snapshotted at time of booking
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  statusUpdatedAt?: string;
  invoiceNumber?: string;
  originalPrice?: number; // present only when a discount was applied; price is the final amount charged
  discountAmount?: number;
  discountReason?: string;
  serviceFee?: number;
  vatAmount?: number;
  creditApplied?: number; // AED credit used toward this booking, if any
  cancelledAt?: string;
  refundCreditAmount?: number; // AED credited back to the parent's balance on cancellation
  cancellationPenaltyPercent?: number; // % forfeited at the time of cancellation, for transparency
  rescheduledAt?: string;
  rescheduledFrom?: { date: string; time: string }; // the original slot, for an audit trail
  trainingMode?: 'at_academy' | 'at_home'; // where this specific session happens
  trainingAddress?: string; // the actual address - either the chosen academy location, or the customer's home address, depending on trainingMode
  packageType?: 'session' | 'month' | 'term'; // which pricing tier this booking was made under
  sessionsIncluded?: number; // snapshot of the plan's session count at booking time - the academy's
  freeSessions?: number;     // plan could change later, so this is captured, not looked up live
  paid: boolean;
  paidAt?: string;
  price: number;
  commission: number;
  coachEarnings: number;
  location: string;
  notes?: string;
  createdAt: string;
}

export const SPORT_TYPES = [
  'Swimming',
  'Football',
  'Gym',
  'Tennis',
  'Basketball',
  'Padel',
  'Gymnastics',
  'Cricket',
];

export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

// Real, commonly known areas/communities within each emirate — covers the
// most likely places an academy or gym would actually be based. "Other"
// is always appended last so an academy in a less common area can still
// type their own area name manually rather than being blocked.
export const UAE_AREAS_BY_EMIRATE: Record<string, string[]> = {
  'Dubai': [
    'Dubai Marina', 'JBR', 'Downtown Dubai', 'Business Bay', 'Jumeirah',
    'Al Barsha', 'Al Quoz', 'Deira', 'Bur Dubai', 'Mirdif', 'Arabian Ranches',
    'Al Nahda', 'Al Qusais', 'Jumeirah Village Circle (JVC)', 'Dubai Hills Estate',
    'Dubai Sports City', 'Motor City', 'Dubailand', 'Al Karama', 'Oud Metha',
    'DIFC', 'Palm Jumeirah', 'Al Furjan', 'Discovery Gardens', 'Other',
  ],
  'Abu Dhabi': [
    'Al Reem Island', 'Yas Island', 'Saadiyat Island', 'Khalifa City',
    'Al Khalidiyah', 'Al Bateen', 'Al Raha', 'Mussafah', 'Al Mushrif',
    'Corniche Area', 'Al Zahiyah', 'Al Shamkha', 'Other',
  ],
  'Sharjah': [
    'Al Nahda', 'Al Majaz', 'Al Khan', 'Al Qasimia', 'Muwaileh',
    'Al Taawun', 'Al Riqqa', 'University City', 'Other',
  ],
  'Ajman': [
    'Al Nuaimiya', 'Al Rashidiya', 'Al Jurf', 'Al Rawda', 'Corniche Ajman', 'Other',
  ],
  'Umm Al Quwain': [
    'UAQ City Centre', 'Al Salamah', 'Al Ramlah', 'Other',
  ],
  'Ras Al Khaimah': [
    'Al Nakheel', 'Al Hamra Village', 'Al Marjan Island', 'Mina Al Arab', 'Other',
  ],
  'Fujairah': [
    'Fujairah City', 'Al Faseel', 'Dibba', 'Other',
  ],
};

export const mockCoaches: Coach[] = [
  {
    id: 'coach1',
    userId: 'user_coach1',
    name: 'Dubai Aqua Academy',
    email: 'info@dubaiaqua.ae',
    sportType: 'Swimming',
    pricePerHour: 250,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'A purpose-built swim academy with two Olympic-standard indoor pools and a full roster of certified instructors. We run structured group and private programs for every level, from first-time water confidence for toddlers through to competitive squad training.',
    avatar: 'https://images.pexels.com/photos/261060/pexels-photo-261060.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2014',
    languages: ['English', 'Arabic'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'],
    availabilityStart: '07:00',
    availabilityEnd: '15:00',
    weeklySchedule: {
      Mon: [{ start: '07:00', end: '15:00' }],
      Tue: [{ start: '07:00', end: '15:00' }],
      Wed: [{ start: '07:00', end: '15:00' }],
      Thu: [{ start: '07:00', end: '15:00' }],
      Sat: [{ start: '07:00', end: '15:00' }],
    },
    sessionDuration: 45,
    verified: true,
  },
  {
    id: 'coach2',
    userId: 'user_coach2',
    name: 'PowerHouse Fitness Gym',
    email: 'hello@powerhousegym.ae',
    sportType: 'Gym',
    pricePerHour: 200,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'A full-equipment strength and conditioning gym with a dedicated team of personal trainers on site. Book a private session, a small-group class, or just reserve floor time with one of our coaches spotting you through your program.',
    avatar: 'https://images.pexels.com/photos/4162485/pexels-photo-4162485.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2017',
    languages: ['English'],
    availability: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'],
    availabilityStart: '06:00',
    availabilityEnd: '12:00',
    weeklySchedule: {
      Mon: [{ start: '06:00', end: '12:00' }],
      Wed: [{ start: '06:00', end: '12:00' }],
      Fri: [{ start: '06:00', end: '12:00' }],
      Sat: [{ start: '06:00', end: '12:00' }],
      Sun: [{ start: '06:00', end: '12:00' }],
    },
    sessionDuration: 60,
    verified: true,
  },
  {
    id: 'coach3',
    userId: 'user_coach3',
    name: 'Padel Pro Club',
    email: 'bookings@padelproclub.ae',
    sportType: 'Padel',
    pricePerHour: 180,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Four glass-walled padel courts and a panel of resident coaches who came up through the Spanish padel scene. Book a coached session to sharpen your game, or simply rent a court and bring your own group.',
    avatar: 'https://images.pexels.com/photos/32474981/pexels-photo-32474981.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2021',
    languages: ['English', 'Spanish'],
    availability: ['Tue', 'Thu', 'Sat', 'Sun'],
    availabilityStart: '15:00',
    availabilityEnd: '19:00',
    weeklySchedule: {
      Tue: [{ start: '15:00', end: '19:00' }],
      Thu: [{ start: '15:00', end: '19:00' }],
      Sat: [{ start: '15:00', end: '19:00' }],
      Sun: [{ start: '15:00', end: '19:00' }],
    },
    sessionDuration: 60,
    verified: true,
  },
  {
    id: 'coach4',
    userId: 'user_coach4',
    name: 'Slam Dunk Basketball Academy',
    email: 'info@slamdunkacademy.ae',
    sportType: 'Basketball',
    pricePerHour: 150,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'An indoor hardwood basketball court with a full coaching staff running age-grouped programs — ball-handling and fundamentals for juniors, structured skills and game-IQ training for serious players.',
    avatar: 'https://images.pexels.com/photos/5407033/pexels-photo-5407033.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2016',
    languages: ['English', 'Hindi'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availabilityStart: '07:00',
    availabilityEnd: '11:00',
    weeklySchedule: {
      Mon: [{ start: '07:00', end: '11:00' }],
      Tue: [{ start: '07:00', end: '11:00' }],
      Wed: [{ start: '07:00', end: '11:00' }],
      Thu: [{ start: '07:00', end: '11:00' }],
      Fri: [{ start: '07:00', end: '11:00' }],
    },
    sessionDuration: 60,
    verified: true,
  },
  {
    id: 'coach5',
    userId: 'user_coach5',
    name: 'Net Smash Padel Academy',
    email: 'hello@netsmashpadel.ae',
    sportType: 'Padel',
    pricePerHour: 220,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'A second padel venue with a strong tactical coaching program — positioning, shot selection, and doubles teamwork — alongside open court rental for first-timers through to club-level players.',
    avatar: 'https://images.pexels.com/photos/4536850/pexels-photo-4536850.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2019',
    languages: ['English', 'Arabic'],
    availability: ['Mon', 'Wed', 'Fri', 'Sat'],
    availabilityStart: '16:00',
    availabilityEnd: '20:00',
    weeklySchedule: {
      Mon: [{ start: '16:00', end: '20:00' }],
      Wed: [{ start: '16:00', end: '20:00' }],
      Fri: [{ start: '16:00', end: '20:00' }],
      Sat: [{ start: '16:00', end: '20:00' }],
    },
    sessionDuration: 60,
    verified: true,
  },
  {
    id: 'coach6',
    userId: 'user_coach6',
    name: 'Ace Tennis Academy',
    email: 'info@acetennis.ae',
    sportType: 'Tennis',
    pricePerHour: 300,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'ITF-affiliated tennis academy with three outdoor hard courts and a full junior-to-adult program. Whether you\'re picking up a racket for the first time or training to compete, our coaches build proper technique and real game strategy.',
    avatar: 'https://images.pexels.com/photos/1784798/pexels-photo-1784798.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2013',
    languages: ['English', 'Korean'],
    availability: ['Tue', 'Thu', 'Sat', 'Sun'],
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
    weeklySchedule: {
      Tue: [{ start: '09:00', end: '17:00' }],
      Thu: [{ start: '09:00', end: '17:00' }],
      Sat: [{ start: '09:00', end: '17:00' }],
      Sun: [{ start: '09:00', end: '17:00' }],
    },
    sessionDuration: 60,
    verified: false,
  },
  {
    id: 'coach7',
    userId: 'user_coach7',
    name: 'Emirates Football Academy',
    email: 'info@emiratesfootball.ae',
    sportType: 'Football',
    pricePerHour: 190,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'A floodlit 5-a-side football pitch with a structured youth and adult coaching program — technical drills, small-sided games, and match strategy. Pitch rental is also available for private bookings outside of program hours.',
    avatar: 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2012',
    languages: ['English', 'Arabic', 'French'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availabilityStart: '17:00',
    availabilityEnd: '21:00',
    weeklySchedule: {
      Mon: [{ start: '17:00', end: '21:00' }],
      Tue: [{ start: '17:00', end: '21:00' }],
      Wed: [{ start: '17:00', end: '21:00' }],
      Thu: [{ start: '17:00', end: '21:00' }],
      Fri: [{ start: '17:00', end: '21:00' }],
      Sat: [{ start: '17:00', end: '21:00' }],
    },
    sessionDuration: 60,
    verified: true,
  },
  {
    id: 'coach8',
    userId: 'user_coach8',
    name: 'Marina Swim School',
    email: 'info@marinaswim.ae',
    sportType: 'Swimming',
    pricePerHour: 280,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'A boutique swim school with a heated outdoor pool, specializing in competitive swimming preparation and open-water training. Our program combines technique, conditioning, and mental coaching for serious swimmers.',
    avatar: 'https://images.pexels.com/photos/8028674/pexels-photo-8028674.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: 'Est. 2015',
    languages: ['English', 'Russian'],
    availability: ['Mon', 'Wed', 'Fri'],
    availabilityStart: '06:00',
    availabilityEnd: '10:00',
    weeklySchedule: {
      Mon: [{ start: '06:00', end: '10:00' }],
      Wed: [{ start: '06:00', end: '10:00' }],
      Fri: [{ start: '06:00', end: '10:00' }],
    },
    sessionDuration: 45,
    verified: true,
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'booking1',
    parentId: 'demo_parent',
    parentName: 'Demo Parent',
    parentEmail: 'parent@demo.com',
    parentPhone: '+971501112233',
    coachId: 'coach1',
    coachName: 'Dubai Aqua Academy',
    sportType: 'Swimming',
    date: '2025-08-15',
    time: '09:00',
    duration: 45,
    status: 'accepted',
    paid: false,
    price: 250,
    commission: 38,
    coachEarnings: 212,
    location: 'Dubai',
    notes: 'Beginner level, 8-year-old child',
    createdAt: '2025-08-01T10:00:00Z',
  },
  {
    id: 'booking2',
    parentId: 'demo_parent',
    parentName: 'Demo Parent',
    parentEmail: 'parent@demo.com',
    parentPhone: '+971501112233',
    coachId: 'coach2',
    coachName: 'PowerHouse Fitness Gym',
    sportType: 'Gym',
    date: '2025-08-18',
    time: '07:00',
    duration: 60,
    status: 'pending',
    paid: false,
    price: 200,
    commission: 30,
    coachEarnings: 170,
    location: 'Dubai',
    createdAt: '2025-08-05T14:30:00Z',
  },
  {
    id: 'booking3',
    parentId: 'demo_parent',
    parentName: 'Demo Parent',
    parentEmail: 'parent@demo.com',
    parentPhone: '+971501112233',
    coachId: 'coach3',
    coachName: 'Padel Pro Club',
    sportType: 'Padel',
    date: '2025-08-10',
    time: '16:00',
    duration: 45,
    status: 'completed',
    paid: true,
    price: 180,
    commission: 27,
    coachEarnings: 153,
    location: 'Dubai',
    notes: 'Group of 2 kids, ages 6 and 9',
    createdAt: '2025-07-28T09:15:00Z',
  },
  {
    id: 'booking4',
    parentId: 'demo_parent',
    parentName: 'Fatima Noor',
    parentEmail: 'fatima.noor@example.com',
    parentPhone: '+971504445566',
    coachId: 'coach4',
    coachName: 'Slam Dunk Basketball Academy',
    sportType: 'Basketball',
    date: '2025-08-20',
    time: '08:00',
    duration: 75,
    status: 'pending',
    paid: false,
    price: 150,
    commission: 22,
    coachEarnings: 128,
    location: 'Dubai',
    notes: 'First yoga session, focus on flexibility',
    createdAt: '2025-08-12T11:20:00Z',
  },
  {
    id: 'booking5',
    parentId: 'demo_parent',
    parentName: 'James Carter',
    parentEmail: 'james.carter@example.com',
    parentPhone: '+971505556677',
    coachId: 'coach5',
    coachName: 'Net Smash Padel Academy',
    sportType: 'Padel',
    date: '2025-08-22',
    time: '17:00',
    duration: 60,
    status: 'accepted',
    paid: false,
    price: 220,
    commission: 33,
    coachEarnings: 187,
    location: 'Dubai',
    notes: '10-year-old, beginner level',
    createdAt: '2025-08-13T16:45:00Z',
  },
  {
    id: 'booking6',
    parentId: 'demo_parent',
    parentName: 'Aisha Khan',
    parentEmail: 'aisha.khan@example.com',
    parentPhone: '+971506667788',
    coachId: 'coach6',
    coachName: 'Ace Tennis Academy',
    sportType: 'Tennis',
    date: '2025-08-12',
    time: '10:00',
    duration: 60,
    status: 'completed',
    paid: true,
    price: 300,
    commission: 45,
    coachEarnings: 255,
    location: 'Dubai',
    createdAt: '2025-08-02T09:00:00Z',
  },
  {
    id: 'booking7',
    parentId: 'demo_parent',
    parentName: 'Demo Parent',
    parentEmail: 'parent@demo.com',
    parentPhone: '+971501112233',
    coachId: 'coach7',
    coachName: 'Emirates Football Academy',
    sportType: 'Football',
    date: '2025-08-25',
    time: '18:00',
    duration: 60,
    status: 'rejected',
    paid: false,
    price: 190,
    commission: 28,
    coachEarnings: 162,
    location: 'Dubai',
    notes: 'Coach unavailable that day — rebooking needed',
    createdAt: '2025-08-14T13:10:00Z',
  },
  {
    id: 'booking8',
    parentId: 'demo_parent',
    parentName: 'Sara Al Maktoum',
    parentEmail: 'sara.almaktoum@example.com',
    parentPhone: '+971507778899',
    coachId: 'coach8',
    coachName: 'Marina Swim School',
    sportType: 'Swimming',
    date: '2025-08-14',
    time: '06:00',
    duration: 45,
    status: 'completed',
    paid: true,
    price: 280,
    commission: 42,
    coachEarnings: 238,
    location: 'Dubai',
    notes: 'Competitive swimmer, stroke technique focus',
    createdAt: '2025-08-03T08:30:00Z',
  },
];

export const mockUsers: User[] = [
  {
    id: 'demo_parent',
    name: 'Demo Parent',
    email: 'parent@demo.com',
    phone: '+971501112233',
    role: 'parent',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'demo_coach',
    name: 'Ahmed Al Rashidi',
    email: 'ahmed@coach.com',
    phone: '+971502223344',
    role: 'coach',
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 'demo_admin',
    name: 'Admin User',
    email: 'admin@coachnow.ae',
    phone: '+971503334455',
    role: 'admin',
    createdAt: '2025-06-01T00:00:00Z',
  },
];
