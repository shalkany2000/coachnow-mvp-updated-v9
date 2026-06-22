import { useState, useEffect } from 'react';
import { Percent, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAdminSidebarItems } from '../../hooks/useAdminSidebarItems';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function AdminSettings() {
  const { items: sidebarItems, title: sidebarTitle } = useAdminSidebarItems();
  const { settings, updateSettings } = useSettings();
  const [rateInput, setRateInput] = useState(String(Math.round(settings.commissionRate * 100)));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRateInput(String(Math.round(settings.commissionRate * 100)));
  }, [settings.commissionRate]);

  const handleSave = async () => {
    setError(''); setSaved(false);
    const percent = parseFloat(rateInput);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setError('Enter a commission percentage between 0 and 100.');
      return;
    }
    setLoading(true);
    try {
      await updateSettings({ commissionRate: percent / 100 });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError("Couldn't save — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarTitle={sidebarTitle}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Platform-level settings — only visible to admins.</p>
        </div>

        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">Platform Commission</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            The cut CoachNow takes from each new booking. Changing this only affects bookings made
            from now on — past bookings keep the rate they were created with.
          </p>

          <label className="text-sm font-medium text-gray-700 block mb-1.5">Commission rate (%)</label>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <span className="text-gray-400 font-medium">%</span>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 mt-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Coaches keep {100 - (parseFloat(rateInput) || 0)}% of each session's price at this rate.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-4">
              <CheckCircle className="w-4 h-4" />
              Saved — new bookings will use the updated rate.
            </div>
          )}

          <Button onClick={handleSave} loading={loading} className="mt-4">
            Save Changes
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
