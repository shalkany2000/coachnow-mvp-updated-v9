import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Search, Star, Shield, Clock, ChevronRight, MapPin, Users, Award, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SPORT_TYPES } from '../lib/mockData';
import { useCoaches } from '../contexts/CoachContext';
import { buildAdminWhatsAppLink, ADMIN_WHATSAPP_NUMBER } from '../lib/config';
import { CoachCard } from '../components/coaches/CoachCard';
import { Navbar } from '../components/layout/Navbar';

const SPORT_ICONS: Record<string, string> = {
  Swimming: '🏊',
  Fitness: '💪',
  Tennis: '🎾',
  Padel: '🏓',
  Badminton: '🏸',
};

const stats = [
  { value: '200+', label: 'Expert Coaches', icon: <Users className="w-5 h-5" /> },
  { value: '4.8★', label: 'Average Rating', icon: <Star className="w-5 h-5" /> },
  { value: '1,500+', label: 'Sessions Booked', icon: <Award className="w-5 h-5" /> },
  { value: '15+', label: 'Sports Covered', icon: <Zap className="w-5 h-5" /> },
];

const howItWorks = [
  {
    step: '01',
    title: 'Browse Coaches',
    desc: 'Search and filter top-rated coaches by sport, location, and price in Dubai.',
    icon: <Search className="w-6 h-6" />,
  },
  {
    step: '02',
    title: 'Book a Session',
    desc: 'Choose your preferred date and time, then send a booking request instantly.',
    icon: <Clock className="w-6 h-6" />,
  },
  {
    step: '03',
    title: 'Train & Improve',
    desc: 'Your coach confirms the session. Show up, train hard and reach your goals.',
    icon: <Dumbbell className="w-6 h-6" />,
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { coaches } = useCoaches();
  const featuredCoaches = [...coaches].filter(c => c.verified && !c.onLeave).sort((a, b) => b.rating - a.rating).slice(0, 3);

  const handleSearch = () => {
    const q = query.trim();
    navigate(q ? `/coaches?search=${encodeURIComponent(q)}` : '/coaches');
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/90 to-indigo-800/90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-white/30">
            <MapPin className="w-4 h-4" />
            <span>Now Available in Dubai 🇦🇪</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
            Find Your Perfect
            <br />
            <span className="text-yellow-300">Sports Coach</span>
            <br />
            in Dubai
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with expert coaches for swimming, fitness, tennis, padel and badminton.
            Book sessions online in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl font-bold"
              onClick={() => navigate('/coaches')}
            >
              <Search className="w-5 h-5" />
              Find a Coach
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 font-bold"
              onClick={() => navigate('/register')}
            >
              Become a Coach
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Search bar */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-2 flex gap-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 pl-4">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  className="flex-1 text-gray-900 text-sm outline-none placeholder-gray-400"
                  placeholder="Search by sport, location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button size="md" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 70 960 0 720 30C480 60 240 0 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-xl mb-3">
                {stat.icon}
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sport Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Sport</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {SPORT_TYPES.map((sport) => (
            <button
              key={sport}
              onClick={() => navigate(`/coaches?sport=${sport}`)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-2xl transition-all duration-200 group"
            >
              <span className="text-2xl">{SPORT_ICONS[sport] || '🏋️'}</span>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-700 text-center leading-tight">{sport}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Coaches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Coaches in Dubai</h2>
            <p className="text-gray-500 mt-1">Verified coaches with proven track records</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/coaches')}>
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCoaches.map(coach => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">How CoachNow Works</h2>
            <p className="text-gray-500 mt-3 text-lg">3 simple steps to your first session</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      {step.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                      {step.step.replace('0', '')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-500 max-w-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="w-6 h-6" />, title: 'Verified Coaches', desc: 'Every coach is background-checked and credentials-verified before joining.' },
            { icon: <Star className="w-6 h-6" />, title: 'Reviewed & Rated', desc: 'Real reviews from parents who have booked sessions. 100% transparent.' },
            { icon: <Zap className="w-6 h-6" />, title: 'Instant Booking', desc: 'Book a session in under 2 minutes. No back-and-forth emails needed.' },
          ].map(item => (
            <div key={item.title} className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to Start Training?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of families finding the best coaches in Dubai.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-xl"
              onClick={() => navigate('/register')}
            >
              Sign Up Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 font-bold"
              onClick={() => navigate('/coaches')}
            >
              Browse Coaches
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">CoachNow</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
              <Link to="/coaches" className="hover:text-white transition-colors">Find Coaches</Link>
              <Link to="/register" className="hover:text-white transition-colors">Become a Coach</Link>
              <a href="mailto:hello@coachnow.ae" className="hover:text-white transition-colors">Contact</a>
              <a
                href={buildAdminWhatsAppLink('Hi, I have a suggestion/complaint about CoachNow:')}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Suggestions &amp; Complaints: +{ADMIN_WHATSAPP_NUMBER.slice(0, 3)} {ADMIN_WHATSAPP_NUMBER.slice(3, 5)} {ADMIN_WHATSAPP_NUMBER.slice(5, 8)} {ADMIN_WHATSAPP_NUMBER.slice(8)}
              </a>
            </div>
            <p className="text-sm text-center">© 2025 CoachNow · Dubai, UAE 🇦🇪</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
