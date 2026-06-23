import { useState, useEffect } from 'react';
import { LayoutDashboard, User, BookOpen, Calendar, DollarSign, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoaches } from '../../contexts/CoachContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SPORT_TYPES, DUBAI_AREAS } from '../../lib/mockData';
import { formatTime } from '../../utils/time';

const sidebarItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'My Profile', path: '/coach/profile-setup', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/coach/bookings', icon: <BookOpen className="w-full h-full" /> },
  { label: 'Schedule', path: '/coach/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Earnings', path: '/coach/earnings', icon: <DollarSign className="w-full h-full" /> },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LANGUAGES = ['English', 'Arabic', 'Hindi', 'Urdu', 'Filipino', 'French', 'Russian', 'Spanish'];

export function CoachProfileSetup() {
  const { currentUser } = useAuth();
  const { coaches, updateCoach, addCoach } = useCoaches();
  const { settings } = useSettings();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const existingCoach = coaches.find(c =>
    c.userId === currentUser?.id || c.email === currentUser?.email
  );

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    bio: existingCoach?.bio || '',
    sportType: existingCoach?.sportType || '',
    pricePerHour: existingCoach?.pricePerHour?.toString() || '',
    location: existingCoach?.location || '',
    experience: existingCoach?.experience || '',
    avatar: existingCoach?.avatar || '',
    availability: existingCoach?.availability || [],
    availabilityStart: existingCoach?.availabilityStart || '08:00',
    availabilityEnd: existingCoach?.availabilityEnd || '18:00',
    sessionDuration: existingCoach?.sessionDuration?.toString() || '60',
    languages: existingCoach?.languages || [],
    onLeave: existingCoach?.onLeave || false,
  });

  useEffect(() => {
    if (existingCoach) {
      setForm({
        name: existingCoach.name,
        bio: existingCoach.bio,
        sportType: existingCoach.sportType,
        pricePerHour: existingCoach.pricePerHour.toString(),
        location: existingCoach.location,
        experience: existingCoach.experience,
        avatar: existingCoach.avatar,
        availability: existingCoach.availability,
        availabilityStart: existingCoach.availabilityStart || '08:00',
        availabilityEnd: existingCoach.availabilityEnd || '18:00',
        sessionDuration: (existingCoach.sessionDuration || 60).toString(),
        languages: existingCoach.languages,
        onLeave: existingCoach.onLeave || false,
      });
    }
  }, [existingCoach?.id]);

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!form.name.trim() || !form.sportType || !form.location || !form.pricePerHour) {
      setError('Please fill in your name, sport, location and price before saving.');
      return;
    }
    if (form.availabilityStart >= form.availabilityEnd) {
      setError('Your "available until" time must be after your "available from" time.');
      return;
    }
    setLoading(true);
    try {
      const profileData = {
        name: form.name,
        bio: form.bio,
        sportType: form.sportType,
        pricePerHour: parseInt(form.pricePerHour) || 0,
        location: form.location,
        experience: form.experience,
        avatar: form.avatar,
        availability: form.availability,
        availabilityStart: form.availabilityStart,
        availabilityEnd: form.availabilityEnd,
        sessionDuration: parseInt(form.sessionDuration) || 60,
        languages: form.languages,
        onLeave: form.onLeave,
        email: currentUser?.email || '',
      };
      if (existingCoach) {
        await updateCoach(existingCoach.id, profileData);
      } else {
        await addCoach({
          ...profileData,
          id: `coach_${Date.now()}`,
          userId: currentUser?.id || '',
          rating: 0,
          reviewCount: 0,
          verified: false,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save coach profile:', err);
      setError('Something went wrong saving your profile — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Coach Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Set up your coach profile to attract clients</p>
          </div>
          <Button onClick={handleSave} loading={loading} variant={saved ? 'secondary' : 'primary'}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-red-600 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Profile saved successfully! Changes are now live.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Describe your coaching experience, qualifications, and what makes your sessions special..."
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500 characters</p>
                </div>
                <Input
                  label="Profile Photo URL"
                  value={form.avatar}
                  onChange={e => setForm(p => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://your-photo-url.com/photo.jpg"
                />
                {form.avatar && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img src={form.avatar} alt="Preview" className="w-14 h-14 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <p className="text-xs text-gray-500">Profile photo preview</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Coaching Details */}
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Coaching Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Sport / Specialty"
                  value={form.sportType}
                  onChange={e => setForm(p => ({ ...p, sportType: e.target.value }))}
                  options={SPORT_TYPES.map(s => ({ value: s, label: s }))}
                  placeholder="Select sport"
                />
                <Select
                  label="Primary Location"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  options={DUBAI_AREAS.map(a => ({ value: a, label: a }))}
                  placeholder="Select area"
                />
                <Input
                  label="Price per Session (AED)"
                  type="number"
                  value={form.pricePerHour}
                  onChange={e => setForm(p => ({ ...p, pricePerHour: e.target.value }))}
                  placeholder="e.g. 250"
                />
                <Input
                  label="Years of Experience"
                  value={form.experience}
                  onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                  placeholder="e.g. 5 years"
                />
                <Select
                  label="Session Duration"
                  value={form.sessionDuration}
                  onChange={e => setForm(p => ({ ...p, sessionDuration: e.target.value }))}
                  options={[
                    { value: '30', label: '30 minutes' },
                    { value: '45', label: '45 minutes' },
                    { value: '60', label: '60 minutes' },
                    { value: '75', label: '75 minutes' },
                    { value: '90', label: '90 minutes' },
                    { value: '120', label: '120 minutes' },
                  ]}
                  placeholder="Select duration"
                />
              </div>
            </Card>

            {/* Availability */}
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Weekly Availability</h2>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.availability.includes(day)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 mb-4">Select the days you're available to coach</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Available from</label>
                  <input
                    type="time"
                    value={form.availabilityStart}
                    onChange={e => setForm(p => ({ ...p, availabilityStart: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Available until</label>
                  <input
                    type="time"
                    value={form.availabilityEnd}
                    onChange={e => setForm(p => ({ ...p, availabilityEnd: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              {form.availabilityStart >= form.availabilityEnd && (
                <p className="text-xs text-red-500 mt-2">End time must be after start time.</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Clients will only be able to book hourly slots inside this time window, on the days you've selected above.
              </p>
            </Card>

            {/* On Leave */}
            <Card className={form.onLeave ? 'border-2 border-amber-300 bg-amber-50' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Taking a break?</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Turn this on while you're away — your profile is hidden from new bookings until you turn it back off.
                    Existing bookings aren't affected.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.onLeave}
                  onClick={() => setForm(p => ({ ...p, onLeave: !p.onLeave }))}
                  className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors ${
                    form.onLeave ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.onLeave ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
              {form.onLeave && (
                <p className="text-sm font-semibold text-amber-700 mt-3">
                  🌴 You're currently set as on leave — clients can't book you right now.
                </p>
              )}
            </Card>

            {/* Languages */}
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Languages Spoken</h2>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      form.languages.includes(lang)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card className="sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Profile Preview</h3>
              <div className="text-center mb-4">
                <img
                  src={form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'Coach')}&background=dbeafe&color=1d4ed8&size=100`}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'Coach')}&background=dbeafe&color=1d4ed8&size=100`;
                  }}
                />
                <h4 className="font-bold text-gray-900">{form.name || 'Your Name'}</h4>
                {form.onLeave && (
                  <span className="inline-block mt-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    🌴 On Leave
                  </span>
                )}
                {form.sportType && <p className="text-sm text-blue-600 font-medium mt-1">{form.sportType}</p>}
                {form.location && <p className="text-xs text-gray-500 mt-0.5">📍 {form.location}</p>}
              </div>
              <div className="space-y-2 text-sm">
                {form.pricePerHour && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rate</span>
                    <span className="font-bold text-blue-600">AED {form.pricePerHour}/session</span>
                  </div>
                )}
                {form.sessionDuration && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Length</span>
                    <span className="font-medium text-gray-800">{form.sessionDuration} min</span>
                  </div>
                )}
                {form.experience && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience</span>
                    <span className="font-medium text-gray-800">{form.experience}</span>
                  </div>
                )}
                {form.availability.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available</span>
                    <span className="font-medium text-gray-800">{form.availability.length} days/week</span>
                  </div>
                )}
                {form.availabilityStart < form.availabilityEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hours</span>
                    <span className="font-medium text-gray-800">
                      {formatTime(form.availabilityStart)} – {formatTime(form.availabilityEnd)}
                    </span>
                  </div>
                )}
              </div>
              {form.bio && (
                <p className="text-xs text-gray-500 mt-4 leading-relaxed line-clamp-4">{form.bio}</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  💡 Platform takes {Math.round(settings.commissionRate * 100)}% commission per booking
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
