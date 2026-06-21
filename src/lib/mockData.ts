export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'parent' | 'coach' | 'admin';
  createdAt: string;
  avatar?: string;
}

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
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
  sessionDuration: number; // minutes
  verified: boolean;
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
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
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

export const DUBAI_AREAS = [
  'Dubai Marina',
  'JBR',
  'Downtown Dubai',
  'Jumeirah',
  'Business Bay',
  'Palm Jumeirah',
  'Arabian Ranches',
  'Mirdif',
  'Deira',
  'Bur Dubai',
  'Al Barsha',
  'DIFC',
];

export const mockCoaches: Coach[] = [
  {
    id: 'coach1',
    userId: 'user_coach1',
    name: 'Ahmed Al Rashidi',
    email: 'ahmed@coach.com',
    sportType: 'Swimming',
    pricePerHour: 250,
    location: 'Dubai Marina',
    rating: 4.9,
    reviewCount: 127,
    bio: 'Former national swimming champion with 10+ years of coaching experience. Specializing in all age groups from beginners to competitive swimmers. I create personalized training plans that focus on technique, endurance, and confidence in water.',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '10 years',
    languages: ['English', 'Arabic'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'],
    availabilityStart: '07:00',
    availabilityEnd: '15:00',
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
    location: 'JBR',
    rating: 4.8,
    reviewCount: 89,
    bio: 'Certified personal trainer and nutrition coach. Specializing in women\'s fitness, weight management, and post-natal recovery. My sessions are energetic, fun and results-driven. Clients see visible changes within 4 weeks.',
    avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '7 years',
    languages: ['English'],
    availability: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'],
    availabilityStart: '06:00',
    availabilityEnd: '12:00',
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
    location: 'Jumeirah',
    rating: 4.9,
    reviewCount: 203,
    bio: 'Padel-obsessed coach who fell in love with the sport in Spain before bringing it to Dubai. I work with complete beginners learning the basics of the glass court, right through to players sharpening their doubles strategy and wall play.',
    avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '12 years',
    languages: ['English', 'Spanish'],
    availability: ['Tue', 'Thu', 'Sat', 'Sun'],
    availabilityStart: '15:00',
    availabilityEnd: '19:00',
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
    location: 'Palm Jumeirah',
    rating: 4.7,
    reviewCount: 64,
    bio: 'Former state-level badminton player from India with 8 years of coaching experience. I focus on footwork, racket control, and smart shot selection — equally comfortable starting a total beginner or sharpening a competitive player\'s game.',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '8 years',
    languages: ['English', 'Hindi'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availabilityStart: '07:00',
    availabilityEnd: '11:00',
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
    location: 'Arabian Ranches',
    rating: 4.8,
    reviewCount: 156,
    bio: 'Ex-professional footballer turned full-time padel coach after the sport took over Dubai. I bring a strong tactical eye to the court — positioning, shot selection, and doubles teamwork — for everyone from first-timers to club-level players.',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '9 years',
    languages: ['English', 'Arabic'],
    availability: ['Mon', 'Wed', 'Fri', 'Sat'],
    availabilityStart: '16:00',
    availabilityEnd: '20:00',
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
    location: 'Downtown Dubai',
    rating: 4.6,
    reviewCount: 42,
    bio: 'ITF-certified tennis coach with experience coaching players of all ages. Whether you\'re picking up a racket for the first time or looking to compete, I\'ll help you develop proper technique and game strategy.',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '6 years',
    languages: ['English', 'Korean'],
    availability: ['Tue', 'Thu', 'Sat', 'Sun'],
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
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
    location: 'Business Bay',
    rating: 4.9,
    reviewCount: 98,
    bio: 'Competitive badminton player turned coach, focused on building a solid foundation — grip, footwork, and smash technique — before moving on to match strategy. I teach both children and adults in a structured, encouraging environment.',
    avatar: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '15 years',
    languages: ['English', 'Arabic', 'French'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availabilityStart: '17:00',
    availabilityEnd: '21:00',
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
    location: 'DIFC',
    rating: 4.7,
    reviewCount: 71,
    bio: 'Olympic-level swimming background. I specialize in competitive swimming preparation and open water training. My unique approach combines strength, technique, and mental conditioning for peak performance.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200',
    experience: '11 years',
    languages: ['English', 'Russian'],
    availability: ['Mon', 'Wed', 'Fri'],
    availabilityStart: '06:00',
    availabilityEnd: '10:00',
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
    location: 'Dubai Marina',
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
    location: 'JBR',
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
    location: 'Jumeirah',
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
    location: 'Palm Jumeirah',
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
    location: 'Arabian Ranches',
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
    location: 'Downtown Dubai',
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
    location: 'Business Bay',
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
    location: 'DIFC',
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
