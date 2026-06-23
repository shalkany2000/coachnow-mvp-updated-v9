import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { SPORT_TYPES, DUBAI_AREAS } from '../../lib/mockData';
import { visibleCoaches, isSportLive } from '../../lib/sports';
import { CoachCard } from '../../components/coaches/CoachCard';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';

export function CoachesListPage() {
  const { coaches } = useCoaches();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sportFilter, setSportFilter] = useState(searchParams.get('sport') || '');
  const [locationFilter, setLocationFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const sport = searchParams.get('sport');
    if (sport) setSportFilter(sport);
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  const filtered = visibleCoaches(coaches).filter(coach => {
    if (coach.onLeave) return false;
    if (search && !coach.name.toLowerCase().includes(search.toLowerCase()) &&
      !coach.bio.toLowerCase().includes(search.toLowerCase()) &&
      !coach.sportType.toLowerCase().includes(search.toLowerCase())) return false;
    if (sportFilter && coach.sportType !== sportFilter) return false;
    if (locationFilter && coach.location !== locationFilter) return false;
    if (minPrice && coach.pricePerHour < parseInt(minPrice)) return false;
    if (maxPrice && coach.pricePerHour > parseInt(maxPrice)) return false;
    if (minRating && coach.rating < parseFloat(minRating)) return false;
    return true;
  });

  const clearFilters = () => {
    setSportFilter(''); setLocationFilter('');
    setMinPrice(''); setMaxPrice(''); setMinRating(''); setSearch('');
  };

  const hasFilters = sportFilter || locationFilter || minPrice || maxPrice || minRating || search;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Find Your Coach</h1>
          <p className="text-gray-500 mt-1">{filtered.length} coaches available in Dubai</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900"
                placeholder="Search coaches, sports..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="w-2 h-2 bg-yellow-400 rounded-full" />}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Sport</label>
                <select
                  value={sportFilter}
                  onChange={e => setSportFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sports</option>
                  {SPORT_TYPES.map(s => (
                    <option key={s} value={s}>{s}{!isSportLive(s, coaches) ? ' (Coming Soon)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Location</label>
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Areas</option>
                  {DUBAI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Min Price (AED)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Max Price (AED)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Min Rating</label>
                <select
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                  <option value="4.8">4.8+</option>
                </select>
              </div>
              {hasFilters && (
                <div className="flex items-end col-span-2 sm:col-span-3 lg:col-span-5">
                  <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium">
                    <X className="w-4 h-4" /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sport Quick Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSportFilter('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!sportFilter ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
          >
            All Sports
          </button>
          {SPORT_TYPES.map(sport => {
            const live = isSportLive(sport, coaches);
            return (
              <button
                key={sport}
                onClick={() => setSportFilter(sport === sportFilter ? '' : sport)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${sportFilter === sport ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
              >
                {sport}
                {!live && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sportFilter === sport ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          sportFilter && !isSportLive(sportFilter, coaches) ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{sportFilter} coaches coming soon!</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                We don't have a {sportFilter.toLowerCase()} coach on CoachNow just yet — but we're actively
                onboarding trainers. Check back soon, or browse another sport in the meantime.
              </p>
              <Button onClick={clearFilters}>Browse All Coaches</Button>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No coaches found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(coach => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
