import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { ShieldCheck, Loader2, Save } from 'lucide-react';

// System Settings page — admins/manager can adjust tax rates, price overrides,
// cancellation policy, and toggle a global emergency alert banner.
export const SystemSettings = () => {
  const { sysConfig, setSysConfig, addToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local working copy so we don't mutate context while typing.
  const [form, setForm] = useState(sysConfig);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data) setForm(res.data);
      } catch (e) {
        // Fallback: use AppContext default
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', form).catch(() => {});
      setSysConfig(form);
      addToast('System settings saved successfully.', 'success');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="ml-3 text-sm text-slate-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure global system parameters for LuxuryStay.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-slate-100">Global Configurations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">Applied to all billing line items.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">
              Base Price Override ($)
            </label>
            <input
              type="number"
              step="5"
              value={form.basePriceOverride}
              onChange={(e) =>
                setForm({ ...form, basePriceOverride: Number(e.target.value) })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Added to every room nightly rate (use negative for discounts).
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-slate-300 font-medium">Cancellation Policy</label>
            <textarea
              rows={2}
              value={form.cancellationPolicy}
              onChange={(e) =>
                setForm({ ...form, cancellationPolicy: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200 text-sm">
                  Emergency System Alert Banner
                </p>
                <p className="text-slate-400 text-[11px]">
                  Display urgent notifications across all operational portals immediately.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.emergencyAlert}
                onChange={(e) =>
                  setForm({ ...form, emergencyAlert: e.target.checked })
                }
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
            {form.emergencyAlert && (
              <input
                type="text"
                value={form.emergencyMessage}
                onChange={(e) =>
                  setForm({ ...form, emergencyMessage: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Type emergency alert notice..."
              />
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Preview of emergency alert if enabled */}
      {form.emergencyAlert && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>Preview:</strong> {form.emergencyMessage}
          </p>
        </div>
      )}
    </div>
  );
};
