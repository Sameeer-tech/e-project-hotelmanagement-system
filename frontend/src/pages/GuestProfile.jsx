import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { Badge } from '../components/ui/Badge';
import { UserCircle, Phone, Mail, Globe, Star, Edit3, Save, X, Loader2 } from 'lucide-react';

// Guest Profile page — lets a guest view & edit their personal info, preferences,
// and see their stay / booking history. Staff can also view a demo guest profile.
export const GuestProfile = () => {
  const { user } = useAuth();
  const { guests, updateGuestProfile, addToast, getEffectiveRoomPrice } = useApp();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use first mock guest as demo profile; real app would fetch by user._id.
  const guest = guests[0] || null;

  // Editable working copy
  const [form, setForm] = useState(guest);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Only make the API call if this is a guest user (staff viewing demo stays local)
        if (user.role === 'guest') {
          const res = await api.get(`/guests/${user._id}`).catch(() => null);
          if (res && res.data) setForm(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (!form) {
    return (
      <div className="p-10 text-center text-slate-500">No guest profile found.</div>
    );
  }

  const saveProfile = async () => {
    try {
      setLoading(true);
      await api.put(`/guests/${form.id || user?._id}`, form).catch(() => {});
      if (form.id) updateGuestProfile(form.id, form);
      addToast('Profile updated successfully.', 'success');
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChange, icon: Icon }) => (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
        />
      ) : (
        <p className="text-sm text-slate-200 font-medium">{value || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Guest Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Personal information and stay history.</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setForm(guest);
                setEditing(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile hero card */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-3xl font-bold border-2 border-indigo-500/30">
          <UserCircle className="w-16 h-16" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-2xl font-bold text-white">{form.name}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Loyalty Tier:{' '}
            <Badge variant={form.loyaltyTier === 'Platinum' ? 'Platinum' : 'Active'}>
              {form.loyaltyTier || 'Standard'}
            </Badge>
            <span className="ml-3 text-indigo-300 font-semibold">
              {form.points?.toLocaleString() || 0} pts
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Guest ID: {form.id || user?._id}
          </p>
        </div>
      </div>

      {/* Personal info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
            Personal Information
          </h3>
          <Field
            label="Full Name"
            value={form.name || ''}
            onChange={(v) => setForm({ ...form, name: v })}
            icon={UserCircle}
          />
          <Field
            label="Email"
            value={form.email || ''}
            onChange={(v) => setForm({ ...form, email: v })}
            icon={Mail}
          />
          <Field
            label="Phone"
            value={form.phone || ''}
            onChange={(v) => setForm({ ...form, phone: v })}
            icon={Phone}
          />
          <Field
            label="Nationality"
            value={form.nationality || ''}
            onChange={(v) => setForm({ ...form, nationality: v })}
            icon={Globe}
          />
          <Field
            label="Passport / ID"
            value={form.passport || ''}
            onChange={(v) => setForm({ ...form, passport: v })}
            icon={UserCircle}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
            Preferences
          </h3>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Stay Preferences
            </p>
            {editing ? (
              <input
                type="text"
                value={(form.preferences || []).join(', ')}
                onChange={(e) =>
                  setForm({
                    ...form,
                    preferences: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Separate by comma"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(form.preferences || []).map((p, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 rounded-md text-xs"
                  >
                    {p}
                  </span>
                ))}
                {(!form.preferences || form.preferences.length === 0) && (
                  <span className="text-xs text-slate-500">No preferences set.</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Special Requests
            </p>
            {editing ? (
              <input
                type="text"
                value={(form.specialRequests || []).join(', ')}
                onChange={(e) =>
                  setForm({
                    ...form,
                    specialRequests: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Separate by comma"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(form.specialRequests || []).map((p, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md text-xs"
                  >
                    {p}
                  </span>
                ))}
                {(!form.specialRequests || form.specialRequests.length === 0) && (
                  <span className="text-xs text-slate-500">None.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking / stay history */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100">Booking History</h3>
          <Badge variant="Active">{form.stayHistory?.length || 0} stays</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="p-4">Dates</th>
                <th className="p-4">Room</th>
                <th className="p-4">Total Paid</th>
                <th className="p-4">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(form.stayHistory || []).map((s, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="p-4 font-medium text-slate-100">{s.dates}</td>
                  <td className="p-4">#{s.room}</td>
                  <td className="p-4 font-semibold text-emerald-400">{s.total}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < s.rating ? 'fill-current' : 'opacity-20'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {(!form.stayHistory || form.stayHistory.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    No stays yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
