import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, CheckCircle, ChevronDown, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { Coach, VerificationChecklist } from '../../lib/mockData';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAdminSidebarItems } from '../../hooks/useAdminSidebarItems';

const sportColors: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  Swimming: 'blue', Football: 'green', Gym: 'red', Tennis: 'purple', Basketball: 'yellow', Padel: 'gray', Gymnastics: 'purple', Cricket: 'green',
};

const DEFAULT_CHECKLIST: VerificationChecklist = {
  idVerified: false,
  certificationVerified: false,
  backgroundCheckCleared: false,
};

export function AdminCoaches() {
  const navigate = useNavigate();
  const { items: sidebarItems, title: sidebarTitle } = useAdminSidebarItems();
  const { coaches, updateCoach, syncStarterListings } = useCoaches();
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [actionError, setActionError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncDone, setSyncDone] = useState(false);

  const handleSync = async () => {
    setActionError(''); setSyncing(true);
    try {
      await syncStarterListings();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 4000);
    } catch (err) {
      console.error('Failed to sync starter listings:', err);
      setActionError("Couldn't refresh starter listings — check your connection and try again.");
    } finally {
      setSyncing(false);
      setShowSyncConfirm(false);
    }
  };

  // "Verified" shown publicly on a coach's profile is now derived from
  // all three checklist items being true — not a single blind toggle.
  // This is what actually changed: verification went from a button click
  // to a real, auditable process.
  const toggleChecklistItem = async (coach: Coach, field: keyof VerificationChecklist) => {
    setActionError('');
    const current = coach.verificationChecklist || DEFAULT_CHECKLIST;
    const next: VerificationChecklist = { ...current, [field]: !current[field] };
    const verified = next.idVerified && next.certificationVerified && next.backgroundCheckCleared;
    try {
      await updateCoach(coach.id, { verificationChecklist: next, verified });
    } catch (err) {
      console.error('Failed to update coach verification:', err);
      setActionError("Couldn't update that academy — check your connection and try again.");
    }
  };

  const filtered = coaches.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sportType.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  const verified = coaches.filter(c => c.verified).length;

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle={sidebarTitle}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Academies</h1>
            <p className="text-gray-500 mt-1">{coaches.length} total academies · {verified} verified</p>
          </div>
          {!showSyncConfirm ? (
            <button
              onClick={() => setShowSyncConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Starter Listings
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  This overwrites the 8 starter listings (coach1–coach8) with the latest built-in data — any
                  manual edits made to those specific listings will be lost. Real academies that registered
                  themselves are never affected.
                </p>
              </div>
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => setShowSyncConfirm(false)} className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg hover:bg-white/50">
                  Cancel
                </button>
                <button onClick={handleSync} disabled={syncing} className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg disabled:opacity-50">
                  {syncing ? 'Refreshing...' : 'Yes, Refresh'}
                </button>
              </div>
            </div>
          )}
        </div>
        {syncDone && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 rounded-xl px-4 py-2.5">
            <CheckCircle className="w-4 h-4" />
            Starter listings refreshed.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Academies', value: coaches.length, color: 'blue' },
            { label: 'Verified', value: verified, color: 'green' },
            { label: 'Pending Verification', value: coaches.length - verified, color: 'yellow' },
          ].map(stat => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className={`text-2xl font-black ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : 'text-yellow-600'}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900"
            placeholder="Search coaches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {actionError}
          </div>
        )}

        {/* Coach Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(coach => (
            <Card key={coach.id}>
              <div className="flex items-start gap-4">
                <img
                  src={coach.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=60`}
                  alt={coach.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=dbeafe&color=1d4ed8&size=60`; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{coach.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant={sportColors[coach.sportType] || 'gray'} size="sm">{coach.sportType}</Badge>
                        {coach.verified
                          ? <Badge variant="green" size="sm">✓ Verified</Badge>
                          : <Badge variant="yellow" size="sm">Pending</Badge>
                        }
                        {coach.onLeave && <Badge variant="yellow" size="sm">🌴 On Leave</Badge>}
                      </div>
                    </div>
                    <span className="font-bold text-blue-600 text-sm flex-shrink-0">AED {coach.pricePerHour}/session</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{coach.rating} ({coach.reviewCount})</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{coach.location}</span>
                  </div>
                </div>
              </div>
              {/* Admin Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setExpandedId(expandedId === coach.id ? null : coach.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors ${
                    coach.verified ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {coach.verified ? 'Verified' : `Verification (${Object.values(coach.verificationChecklist || DEFAULT_CHECKLIST).filter(v => v === true).length}/3)`}
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === coach.id ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => navigate(`/coaches/${coach.id}`)}
                  className="flex-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 py-2 rounded-lg transition-colors"
                >
                  View Profile
                </button>
              </div>

              {expandedId === coach.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {([
                    ['idVerified', 'Trade license checked'],
                    ['certificationVerified', 'Certifications checked'],
                    ['backgroundCheckCleared', 'Background check cleared'],
                  ] as const).map(([field, label]) => {
                    const checked = (coach.verificationChecklist || DEFAULT_CHECKLIST)[field];
                    return (
                      <button
                        key={field}
                        onClick={() => toggleChecklistItem(coach, field)}
                        className="w-full flex items-center gap-2.5 text-left"
                      >
                        <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}>
                          {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </span>
                        <span className={`text-xs ${checked ? 'text-gray-700' : 'text-gray-500'}`}>{label}</span>
                      </button>
                    );
                  })}
                  <p className="text-xs text-gray-400 pt-1">
                    Verification happens offline (academy sends license/certs via WhatsApp) — check each item off here once you've actually reviewed it.
                    "Verified" only shows on their public profile once all three are checked.
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
