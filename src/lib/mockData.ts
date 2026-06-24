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

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  sportType: string;
  pricePerHour: number;
  location: string;
  rating: number;
  reviewCount: number;
  bio: string;
  avatar: string;
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
  trainingAddress?: string; // where the coach should actually go for this specific session
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
  'Fitness',
  'Tennis',
  'Padel',
  'Badminton',
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

export const mockCoaches: Coach[] = [
  {
    id: 'coach1',
    userId: 'user_coach1',
    name: 'Ahmed Al Rashidi',
    email: 'ahmed@coach.com',
    sportType: 'Swimming',
    pricePerHour: 250,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Former national swimming champion with 10+ years of coaching experience. Specializing in all age groups from beginners to competitive swimmers. I create personalized training plans that focus on technique, endurance, and confidence in water.',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '10 years',
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
    name: 'Sarah Mitchell',
    email: 'sarah@coach.com',
    sportType: 'Fitness',
    pricePerHour: 200,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Certified personal trainer and nutrition coach. Specializing in women\'s fitness, weight management, and post-natal recovery. My sessions are energetic, fun and results-driven. Clients see visible changes within 4 weeks.',
    avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '7 years',
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
    name: 'Carlos Mendez',
    email: 'carlos@coach.com',
    sportType: 'Padel',
    pricePerHour: 180,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Padel-obsessed coach who fell in love with the sport in Spain before bringing it to Dubai. I work with complete beginners learning the basics of the glass court, right through to players sharpening their doubles strategy and wall play.',
    avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '12 years',
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
    name: 'Priya Sharma',
    email: 'priya@coach.com',
    sportType: 'Badminton',
    pricePerHour: 150,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Former state-level badminton player from India with 8 years of coaching experience. I focus on footwork, racket control, and smart shot selection — equally comfortable starting a total beginner or sharpening a competitive player\'s game.',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '8 years',
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
    name: 'Omar Hassan',
    email: 'omar@coach.com',
    sportType: 'Padel',
    pricePerHour: 220,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Ex-professional footballer turned full-time padel coach after the sport took over Dubai. I bring a strong tactical eye to the court — positioning, shot selection, and doubles teamwork — for everyone from first-timers to club-level players.',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '9 years',
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
    name: 'Jessica Lee',
    email: 'jessica@coach.com',
    sportType: 'Tennis',
    pricePerHour: 300,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'ITF-certified tennis coach with experience coaching players of all ages. Whether you\'re picking up a racket for the first time or looking to compete, I\'ll help you develop proper technique and game strategy.',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '6 years',
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
    name: 'Rami Khalil',
    email: 'rami@coach.com',
    sportType: 'Badminton',
    pricePerHour: 190,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Competitive badminton player turned coach, focused on building a solid foundation — grip, footwork, and smash technique — before moving on to match strategy. I teach both children and adults in a structured, encouraging environment.',
    avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '15 years',
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
    name: 'Nadia Petrov',
    email: 'nadia@coach.com',
    sportType: 'Swimming',
    pricePerHour: 280,
    location: 'Dubai',
    rating: 0,
    reviewCount: 0,
    bio: 'Olympic-level swimming background. I specialize in competitive swimming preparation and open water training. My unique approach combines strength, technique, and mental conditioning for peak performance.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '11 years',
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
    coachName: 'Ahmed Al Rashidi',
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
    coachName: 'Sarah Mitchell',
    sportType: 'Fitness',
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
    coachName: 'Carlos Mendez',
    sportType: 'Kids Training',
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
    coachName: 'Priya Sharma',
    sportType: 'Yoga',
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
    coachName: 'Omar Hassan',
    sportType: 'Football',
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
    coachName: 'Jessica Lee',
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
    coachName: 'Rami Khalil',
    sportType: 'Martial Arts',
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
    coachName: 'Nadia Petrov',
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
