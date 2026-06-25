import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, CheckCircle, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCoaches } from '../../contexts/CoachContext';
import { Coach, VerificationChecklist } from '../../lib/mockData';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAdminSidebarItems } from '../../hooks/useAdminSidebarItems';

const sportColors: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  Swimming: 'blue', Fitness: 'green', Tennis: 'purple', Padel: 'yellow', Badminton: 'red',
};

const DEFAULT_CHECKLIST: VerificationChecklist = {
  idVerified: false,
  certificationVerified: false,
  backgroundCheckCleared: false,
};

export function AdminCoaches() {
  const navigate = useNavigate();
  const { items: sidebarItems, title: sidebarTitle } = useAdminSidebarItems();
  const { coaches, updateCoach } = useCoaches();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      setActionError("Couldn't update that coach — check your connection and try again.");
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
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coaches</h1>
          <p className="text-gray-500 mt-1">{coaches.length} total coaches · {verified} verified</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Coaches', value: coaches.length, color: 'blue' },
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
                    ['idVerified', 'ID document checked'],
                    ['certificationVerified', 'Coaching certification checked'],
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
                    Verification happens offline (coach sends ID/certs via WhatsApp) — check each item off here once you've actually reviewed it.
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
