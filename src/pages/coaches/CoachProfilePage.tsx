import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, CheckCircle, Globe, Calendar, ArrowLeft, Share2 } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewContext';
import { isSeedCoach, isSportLive } from '../../lib/sports';
import { DAY_KEYS } from '../../lib/mockData';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { formatTime, formatRelativeTime } from '../../utils/time';

const sportColors: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  Swimming: 'blue', Fitness: 'green', Tennis: 'purple', Padel: 'yellow', Badminton: 'red',
};

export function CoachProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCoach, coaches } = useCoaches();
  const { currentUser } = useAuth();
  const { getReviewsForCoach } = useReviews();
  const coach = getCoach(id || '');
  const [copied, setCopied] = useState(false);
  const reviews = coach ? getReviewsForCoach(coach.id) : [];
  const isHidden = coach && isSeedCoach(coach) && !isSportLive(coach.sportType, coaches);

  if (!coach || isHidden) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Academy not found</h2>
            <Button onClick={() => navigate('/coaches')}>Back to Academies</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBook = () => {
    if (!currentUser) { navigate('/login'); return; }
    navigate(`/coaches/${coach.id}/book`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${coach.name} on CoachNow`, url });
      } catch {
        // user cancelled the native share sheet - nothing to do
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/coaches')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Academies
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={coach.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=120`}
                    alt={coach.name}
                    className="w-28 h-28 rounded-2xl object-cover shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=120`;
                    }}
                  />
                  {coach.verified && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                      <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-100" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-black text-gray-900">{coach.name}</h1>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={sportColors[coach.sportType] || 'gray'} size="md">
                          {coach.sportType}
                        </Badge>
                        {coach.verified && (
                          <Badge variant="blue" size="md">✓ Verified</Badge>
                        )}
                        {coach.onLeave && (
                          <Badge variant="yellow" size="md">🚧 Temporarily Closed</Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleShare}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors relative"
                      aria-label="Share this academy's profile"
                    >
                      <Share2 className="w-5 h-5" />
                      {copied && (
                        <span className="absolute -bottom-7 right-0 text-xs bg-gray-900 text-white px-2 py-1 rounded-lg whitespace-nowrap">
                          Link copied!
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {coach.reviewCount > 0 ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-gray-800">{coach.rating}</span>
                          <span className="text-gray-400">({coach.reviewCount} reviews)</span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">New on CoachNow</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{coach.experience}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{coach.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{coach.languages.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{coach.bio}</p>
            </Card>

            {/* Availability */}
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Availability</h2>
              <div className="flex gap-2 flex-wrap">
                {DAY_KEYS.map(day => {
                  const dayBlocks = coach.weeklySchedule?.[day];
                  const isWorking = !!dayBlocks && dayBlocks.length > 0;
                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-colors min-w-[64px] ${
                        isWorking
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-100 bg-gray-50 text-gray-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{day}</span>
                      {isWorking && dayBlocks && dayBlocks.map((block, i) => (
                        <span key={i} className="text-[10px] font-medium text-blue-500 mt-1 whitespace-nowrap">
                          {formatTime(block.start)}–{formatTime(block.end)}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Reviews */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                {coach.reviewCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-900">{coach.rating}</span>
                    <span className="text-gray-400 text-sm">({coach.reviewCount})</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No reviews yet — be the first to book and leave one!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600">{review.parentName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{review.parentName}</p>
                            <p className="text-xs text-gray-400">{formatRelativeTime(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-3.5 h-3.5 ${j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 pl-12">{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-black text-blue-600">AED {coach.pricePerHour}</div>
                <div className="text-sm text-gray-400 mt-1">per session</div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Session duration</span>
                  <span className="font-medium text-gray-800">{coach.sessionDuration} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-medium text-gray-800">Online (via WhatsApp)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cancellation</span>
                  <span className="font-medium text-gray-800">24hr notice</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-800">{coach.location}</span>
                </div>
              </div>
              {coach.onLeave ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="font-semibold text-amber-800 text-sm">🌴 Currently on leave</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {coach.name.split(' ')[0]} isn't accepting new bookings right now. Check back soon!
                  </p>
                </div>
              ) : (
                <>
                  <Button fullWidth size="lg" onClick={handleBook}>
                    <Calendar className="w-5 h-5" />
                    Book a Session
                  </Button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Free cancellation up to 24 hours before
                  </p>
                </>
              )}
            </Card>

            {/* Quick Stats */}
            <Card padding="sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-black text-gray-900">{coach.reviewCount}</p>
                  <p className="text-xs text-gray-400">Reviews</p>
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900">{coach.experience.replace(' years', '')}</p>
                  <p className="text-xs text-gray-400">Yrs Exp.</p>
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900">{coach.availability.length}</p>
                  <p className="text-xs text-gray-400">Days/Wk</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
