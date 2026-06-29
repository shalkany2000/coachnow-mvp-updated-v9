import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, CheckCircle } from 'lucide-react';
import { Coach } from '../../lib/mockData';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const sportColors: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  Swimming: 'blue',
  Fitness: 'green',
  Tennis: 'purple',
  Padel: 'yellow',
  Badminton: 'red',
};

export function CoachCard({ coach }: { coach: Coach }) {
  const navigate = useNavigate();

  return (
    <Card hover className="flex flex-col gap-4" onClick={() => navigate(`/coaches/${coach.id}`)}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={coach.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=80`}
            alt={coach.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=80`;
            }}
          />
          {coach.verified && (
            <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-100" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">{coach.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{coach.experience}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-blue-600">AED {coach.pricePerHour}</p>
              <p className="text-xs text-gray-400">per session</p>
              {(coach.pricePerMonth || coach.pricePerTerm) && (
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">+ packages available</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={sportColors[coach.sportType] || 'gray'} size="sm">
              {coach.sportType}
            </Badge>
            {coach.languages.slice(0, 2).map(lang => (
              <Badge key={lang} variant="gray" size="sm">{lang}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          {coach.reviewCount > 0 ? (
            <>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-800">{coach.rating}</span>
              <span className="text-gray-400">({coach.reviewCount})</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">New</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{coach.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{coach.availability.length}d/week</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{coach.bio}</p>

      {/* Availability */}
      <div className="flex gap-1.5 flex-wrap">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <span
            key={day}
            className={`text-xs px-2 py-1 rounded-lg font-medium ${
              coach.availability.includes(day)
                ? 'bg-blue-50 text-blue-600'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Action */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={(e) => { e.stopPropagation(); navigate(`/coaches/${coach.id}`); }}
        >
          View Profile
        </Button>
        <Button
          size="sm"
          fullWidth
          onClick={(e) => { e.stopPropagation(); navigate(`/coaches/${coach.id}/book`); }}
        >
          Book Now
        </Button>
      </div>
    </Card>
  );
}
