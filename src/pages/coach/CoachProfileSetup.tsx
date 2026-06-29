import { useState, useEffect } from 'react';
import { LayoutDashboard, User, BookOpen, Calendar, DollarSign, Save, CheckCircle, AlertCircle, X, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoaches } from '../../contexts/CoachContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SPORT_TYPES, UAE_EMIRATES, DAY_KEYS, DayKey, TimeBlock, Coach } from '../../lib/mockData';
import { isMapLink } from '../../lib/config';

const sidebarItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: <LayoutDashboard className="w-full h-full" /> },
  { label: 'My Profile', path: '/coach/profile-setup', icon: <User className="w-full h-full" /> },
  { label: 'Bookings', path: '/coach/bookings', icon: <BookOpen className="w-full h-full" /> },
  { label: 'Schedule', path: '/coach/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Earnings', path: '/coach/earnings', icon: <DollarSign className="w-full h-full" /> },
];

const DAYS = DAY_KEYS as readonly string[];
const LANGUAGES = ['English', 'Arabic', 'Hindi', 'Urdu', 'Filipino', 'French', 'Russian', 'Spanish'];

// New coaches with no saved schedule yet default to a sensible 9-5,
// Mon-Fri starting point — existing coaches who already had a uniform
// availability window get that window carried over per-day automatically,
// so nobody's calendar silently empties out when this feature ships.
function deriveInitialSchedule(coach?: Coach): Partial<Record<DayKey, TimeBlock[]>> {
  if (coach?.weeklySchedule && Object.keys(coach.weeklySchedule).length > 0) {
    return coach.weeklySchedule;
  }
  if (coach?.availability?.length) {
    const schedule: Partial<Record<DayKey, TimeBlock[]>> = {};
    coach.availability.forEach((day) => {
      schedule[day as DayKey] = [{
        start: coach.availabilityStart || '08:00',
        end: coach.availabilityEnd || '18:00',
      }];
    });
    return schedule;
  }
  return {};
}

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
    isPrivateTraining: existingCoach?.isPrivateTraining || false,
    monthlyEnabled: !!existingCoach?.monthlyPlan,
    monthlyPrice: existingCoach?.monthlyPlan?.price?.toString() || '',
    monthlySessions: existingCoach?.monthlyPlan?.sessionsIncluded?.toString() || '8',
    monthlyFree: existingCoach?.monthlyPlan?.freeSessions?.toString() || '',
    termEnabled: !!existingCoach?.termPlan,
    termPrice: existingCoach?.termPlan?.price?.toString() || '',
    termSessions: existingCoach?.termPlan?.sessionsIncluded?.toString() || '24',
    termFree: existingCoach?.termPlan?.freeSessions?.toString() || '',
    location: existingCoach?.location || '',
    experience: existingCoach?.experience || '',
    avatar: existingCoach?.avatar || '',
    photos: existingCoach?.photos || [],
    locations: existingCoach?.locations || [],
    weeklySchedule: deriveInitialSchedule(existingCoach),
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
        isPrivateTraining: existingCoach.isPrivateTraining || false,
        monthlyEnabled: !!existingCoach.monthlyPlan,
        monthlyPrice: existingCoach.monthlyPlan?.price?.toString() || '',
        monthlySessions: existingCoach.monthlyPlan?.sessionsIncluded?.toString() || '8',
        monthlyFree: existingCoach.monthlyPlan?.freeSessions?.toString() || '',
        termEnabled: !!existingCoach.termPlan,
        termPrice: existingCoach.termPlan?.price?.toString() || '',
        termSessions: existingCoach.termPlan?.sessionsIncluded?.toString() || '24',
        termFree: existingCoach.termPlan?.freeSessions?.toString() || '',
        location: existingCoach.location,
        experience: existingCoach.experience,
        avatar: existingCoach.avatar,
        photos: existingCoach.photos || [],
        locations: existingCoach.locations || [],
        weeklySchedule: deriveInitialSchedule(existingCoach),
        sessionDuration: (existingCoach.sessionDuration || 60).toString(),
        languages: existingCoach.languages,
        onLeave: existingCoach.onLeave || false,
      });
    }
  }, [existingCoach?.id]);

  const addPhoto = () => setForm((p) => ({ ...p, photos: [...p.photos, ''] }));
  const updatePhoto = (index: number, value: string) =>
    setForm((p) => ({ ...p, photos: p.photos.map((url, i) => (i === index ? value : url)) }));
  const removePhoto = (index: number) =>
    setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== index) }));

  const addLocation = () => setForm((p) => ({ ...p, locations: [...p.locations, ''] }));
  const updateLocation = (index: number, value: string) =>
    setForm((p) => ({ ...p, locations: p.locations.map((loc, i) => (i === index ? value : loc)) }));
  const removeLocation = (index: number) =>
    setForm((p) => ({ ...p, locations: p.locations.filter((_, i) => i !== index) }));


  const toggleDayWorking = (day: string) => {
    setForm((p) => {
      const next = { ...p.weeklySchedule };
      if (next[day as DayKey]) {
        delete next[day as DayKey];
      } else {
        next[day as DayKey] = [{ start: '08:00', end: '18:00' }];
      }
      return { ...p, weeklySchedule: next };
    });
  };

  const updateTimeBlock = (day: string, blockIndex: number, field: 'start' | 'end', value: string) => {
    setForm((p) => {
      const blocks = [...(p.weeklySchedule[day as DayKey] || [])];
      blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
      return { ...p, weeklySchedule: { ...p.weeklySchedule, [day]: blocks } };
    });
  };

  // Adds another window to the same day — this is how a coach represents
  // working mornings and evenings while skipping the hours in between.
  const addTimeBlock = (day: string) => {
    setForm((p) => {
      const blocks = p.weeklySchedule[day as DayKey] || [];
      const lastEnd = blocks[blocks.length - 1]?.end || '12:00';
      return {
        ...p,
        weeklySchedule: { ...p.weeklySchedule, [day]: [...blocks, { start: lastEnd, end: '18:00' }] },
      };
    });
  };

  const removeTimeBlock = (day: string, blockIndex: number) => {
    setForm((p) => {
      const blocks = (p.weeklySchedule[day as DayKey] || []).filter((_, i) => i !== blockIndex);
      const next = { ...p.weeklySchedule };
      if (blocks.length === 0) {
        delete next[day as DayKey]; // no blocks left = day off
      } else {
        next[day as DayKey] = blocks;
      }
      return { ...p, weeklySchedule: next };
    });
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
    const workingDays = Object.keys(form.weeklySchedule) as DayKey[];
    if (workingDays.length === 0) {
      setError('Set your hours for at least one day so clients can actually book you.');
      return;
    }
    const invalidDay = workingDays.find((d) => (form.weeklySchedule[d] || []).some((b) => b.start >= b.end));
    if (invalidDay) {
      setError(`${invalidDay} has a block where the end time isn't after the start time.`);
      return;
    }
    if (form.monthlyEnabled && (!form.monthlyPrice.trim() || !form.monthlySessions.trim())) {
      setError('Set a price and number of sessions for the monthly plan, or turn it off.');
      return;
    }
    if (form.termEnabled && (!form.termPrice.trim() || !form.termSessions.trim())) {
      setError('Set a price and number of sessions for the term plan, or turn it off.');
      return;
    }
    setLoading(true);
    try {
      // availability/availabilityStart/End are kept as a quick summary
      // (which days, the widest start-to-end range) for places that just
      // need a glance — actual booking slots always come from
      // weeklySchedule, the real per-day source of truth.
      const allBlocks = workingDays.flatMap((d) => form.weeklySchedule[d] || []);
      const starts = allBlocks.map((b) => b.start);
      const ends = allBlocks.map((b) => b.end);
      const profileData = {
        name: form.name,
        bio: form.bio,
        sportType: form.sportType,
        pricePerHour: parseInt(form.pricePerHour) || 0,
        isPrivateTraining: form.isPrivateTraining,
        ...(form.monthlyEnabled ? {
          monthlyPlan: {
            price: parseInt(form.monthlyPrice) || 0,
            sessionsIncluded: parseInt(form.monthlySessions) || 0,
            ...(form.monthlyFree.trim() ? { freeSessions: parseInt(form.monthlyFree) } : {}),
          },
        } : { monthlyPlan: null }),
        ...(form.termEnabled ? {
          termPlan: {
            price: parseInt(form.termPrice) || 0,
            sessionsIncluded: parseInt(form.termSessions) || 0,
            ...(form.termFree.trim() ? { freeSessions: parseInt(form.termFree) } : {}),
          },
        } : { termPlan: null }),
        location: form.location,
        experience: form.experience,
        avatar: form.avatar,
        photos: form.photos.map((p) => p.trim()).filter(Boolean),
        locations: form.locations.map((l) => l.trim()).filter(Boolean),
        availability: workingDays,
        availabilityStart: starts.sort()[0],
        availabilityEnd: ends.sort().slice(-1)[0],
        weeklySchedule: form.weeklySchedule,
        sessionDuration: parseInt(form.sessionDuration) || 60,
        languages: form.languages,
        onLeave: form.onLeave,
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
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
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle="Academy Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Set up your academy profile to attract clients</p>
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
                  label="Academy / Gym Name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Dubai Aqua Academy"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Describe your facility, programs, and what makes your academy special..."
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500 characters</p>
                </div>
                <Input
                  label="Cover Photo URL"
                  value={form.avatar}
                  onChange={e => setForm(p => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://your-photo-url.com/photo.jpg"
                />
                {form.avatar && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img src={form.avatar} alt="Preview" className="w-14 h-14 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <p className="text-xs text-gray-500">Cover photo preview — shown first on your listing</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Photo Gallery (optional)</label>
                  <p className="text-xs text-gray-400 mb-2.5">
                    Paste links to more photos of your facility — host them anywhere (Google Photos, Imgur, your
                    own website) and paste the direct image link here.
                  </p>
                  <div className="space-y-2.5">
                    {form.photos.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {url && (
                          <img
                            src={url}
                            alt={`Gallery ${i + 1}`}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                          />
                        )}
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updatePhoto(i, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label="Remove photo"
                          className="text-gray-400 hover:text-red-500 p-1.5 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add a photo
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Locations (optional)</label>
                  <p className="text-xs text-gray-400 mb-2.5">
                    Where customers come to train with you in person — add one or more branches. For each, open
                    Google Maps, find the spot, tap <strong>Share</strong> → <strong>Copy link</strong>, and paste
                    it here. A typed address works too.
                  </p>
                  <div className="space-y-2.5">
                    {form.locations.map((loc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={loc}
                          onChange={(e) => updateLocation(i, e.target.value)}
                          placeholder="Paste a Maps link, or type your branch address"
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeLocation(i)}
                          aria-label="Remove location"
                          className="text-gray-400 hover:text-red-500 p-1.5 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {form.locations.some((l) => isMapLink(l)) && (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Maps link detected — customers will see your exact pin.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addLocation}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add a location
                  </button>
                </div>
              </div>
            </Card>

            {/* Coaching Details */}
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Academy Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Sport / Specialty"
                  value={form.sportType}
                  onChange={e => setForm(p => ({ ...p, sportType: e.target.value }))}
                  options={SPORT_TYPES.map(s => ({ value: s, label: s }))}
                  placeholder="Select sport"
                />
                <Select
                  label="Emirate"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  options={UAE_EMIRATES.map(a => ({ value: a, label: a }))}
                  placeholder="Select emirate"
                />
                <Input
                  label="Price per Session (AED)"
                  type="number"
                  value={form.pricePerHour}
                  onChange={e => setForm(p => ({ ...p, pricePerHour: e.target.value }))}
                  placeholder="e.g. 250"
                />
                <Input
                  label="Established Since"
                  value={form.experience}
                  onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                  placeholder="e.g. Est. 2018"
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

              <label className="flex items-center gap-2.5 cursor-pointer mt-5 pt-5 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={form.isPrivateTraining}
                  onChange={(e) => setForm(p => ({ ...p, isPrivateTraining: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  This is <strong>private 1-to-1 training</strong> (not a group class)
                </span>
              </label>

              {/* Monthly Plan */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer mb-3">
                  <span className="text-sm font-bold text-gray-900">Monthly Plan</span>
                  <span className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.monthlyEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={form.monthlyEnabled}
                      onChange={(e) => setForm(p => ({ ...p, monthlyEnabled: e.target.checked }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.monthlyEnabled ? 'translate-x-4' : ''}`} />
                  </span>
                </label>
                {form.monthlyEnabled && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <Input
                      label="Price (AED)"
                      type="number"
                      value={form.monthlyPrice}
                      onChange={e => setForm(p => ({ ...p, monthlyPrice: e.target.value }))}
                      placeholder="e.g. 800"
                    />
                    <Input
                      label="Sessions"
                      type="number"
                      value={form.monthlySessions}
                      onChange={e => setForm(p => ({ ...p, monthlySessions: e.target.value }))}
                      placeholder="8"
                    />
                    <Input
                      label="Free Sessions"
                      type="number"
                      value={form.monthlyFree}
                      onChange={e => setForm(p => ({ ...p, monthlyFree: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Term Plan */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer mb-3">
                  <span className="text-sm font-bold text-gray-900">3-Month Term Plan</span>
                  <span className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.termEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={form.termEnabled}
                      onChange={(e) => setForm(p => ({ ...p, termEnabled: e.target.checked }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.termEnabled ? 'translate-x-4' : ''}`} />
                  </span>
                </label>
                {form.termEnabled && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <Input
                      label="Price (AED)"
                      type="number"
                      value={form.termPrice}
                      onChange={e => setForm(p => ({ ...p, termPrice: e.target.value }))}
                      placeholder="e.g. 2200"
                    />
                    <Input
                      label="Sessions"
                      type="number"
                      value={form.termSessions}
                      onChange={e => setForm(p => ({ ...p, termSessions: e.target.value }))}
                      placeholder="24"
                    />
                    <Input
                      label="Free Sessions"
                      type="number"
                      value={form.termFree}
                      onChange={e => setForm(p => ({ ...p, termFree: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Set the real number of sessions each plan actually includes — 8/month and 24/term are just
                starting suggestions. Add free sessions to sweeten a package without changing its price.
              </p>
            </Card>

            {/* Availability */}
            <Card>
              <h2 className="font-bold text-gray-900 mb-1">Weekly Availability</h2>
              <p className="text-xs text-gray-400 mb-4">
                Toggle a day on, then set your hours. Add a second block on the same day if you
                want to work mornings and evenings but skip the middle of the day.
              </p>
              <div className="space-y-2.5">
                {DAYS.map(day => {
                  const dayBlocks = form.weeklySchedule[day as DayKey] || [];
                  const isWorking = dayBlocks.length > 0;
                  return (
                    <div
                      key={day}
                      className={`rounded-xl border-2 p-3 transition-all ${isWorking ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDayWorking(day)}
                        className="flex items-center gap-2.5"
                      >
                        <span className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${isWorking ? 'bg-blue-600' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isWorking ? 'translate-x-4' : ''}`} />
                        </span>
                        <span className={`text-sm font-semibold ${isWorking ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                      </button>

                      {isWorking && (
                        <div className="mt-3 space-y-2">
                          {dayBlocks.map((block, i) => (
                            <div key={i} className="flex items-center gap-2 flex-wrap">
                              <input
                                type="time"
                                value={block.start}
                                onChange={e => updateTimeBlock(day, i, 'start', e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-400 text-sm">–</span>
                              <input
                                type="time"
                                value={block.end}
                                onChange={e => updateTimeBlock(day, i, 'end', e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {block.start >= block.end && (
                                <span className="text-xs text-red-500">End must be after start</span>
                              )}
                              {dayBlocks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTimeBlock(day, i)}
                                  aria-label="Remove this time block"
                                  className="text-gray-400 hover:text-red-500 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addTimeBlock(day)}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add another block (e.g. skip a lunch break)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Clients will only be able to book slots inside each day's specific hours above.
              </p>
            </Card>

            {/* On Leave */}
            <Card className={form.onLeave ? 'border-2 border-amber-300 bg-amber-50' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-gray-900">Temporarily closed?</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Turn this on for renovations, holidays, or any closure — your profile is hidden from new bookings until you turn it back off. Existing bookings aren't affected.
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
                  🚧 You're currently set as temporarily closed — clients can't book you right now.
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
                  src={form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'Academy')}&background=dbeafe&color=1d4ed8&size=100`}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'Academy')}&background=dbeafe&color=1d4ed8&size=100`;
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
                {Object.keys(form.weeklySchedule).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available</span>
                    <span className="font-medium text-gray-800">{Object.keys(form.weeklySchedule).length} days/week</span>
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
