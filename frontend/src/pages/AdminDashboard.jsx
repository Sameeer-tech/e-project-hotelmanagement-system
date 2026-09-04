import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Percent, DollarSign, BookOpen, AlertCircle, Plus, Search, ShieldCheck, TrendingUp, Star, Pencil, Power } from 'lucide-react';

export const AdminDashboard = () => {
  const { staffList, addStaff, updateStaff, toggleStaffStatus, sysConfig, setSysConfig, rooms, maintenanceLogs, addToast, feedbackScores } = useApp();
  
  // Local Filter & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [timeframe, setTimeframe] = useState('Weekly');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // Staff Form State
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'Receptionist', password: '' });
  const [formErrors, setFormErrors] = useState({});

  const avgFeedback = useMemo(() => {
    if (!feedbackScores?.length) return '0.0';
    const avg = feedbackScores.reduce((s, n) => s + n, 0) / feedbackScores.length;
    return avg.toFixed(1);
  }, [feedbackScores]);

  const occupiedCount = rooms.filter((r) => r.status === 'Occupied').length || 1;
  const totalRevenue = rooms
    .filter((r) => r.status === 'Occupied')
    .reduce((s, r) => s + (Number(r.price) + Number(sysConfig.basePriceOverride || 0)), 0);
  const adr = totalRevenue ? `$${(totalRevenue / occupiedCount).toFixed(0)}` : '$0';

  const openEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffForm({ name: staff.name, email: staff.email, role: staff.role, password: '' });
    setFormErrors({});
    setIsStaffModalOpen(true);
  };

  const closeStaffModal = () => {
    setEditingStaff(null);
    setStaffForm({ name: '', email: '', role: 'Receptionist', password: '' });
    setFormErrors({});
    setIsStaffModalOpen(false);
  };

  // Filtered Staff Calculation
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || staff.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || staff.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  // Handle Add Staff Validation & Submission
  const handleStaffSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!staffForm.name.trim()) errors.name = 'Full name is required';
    if (!staffForm.email.trim()) errors.email = 'Valid email is required';
    if (!editingStaff && (!staffForm.password || staffForm.password.length < 6)) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingStaff) {
      updateStaff(editingStaff.id, { name: staffForm.name, email: staffForm.email, role: staffForm.role });
    } else {
      addStaff({ name: staffForm.name, email: staffForm.email, role: staffForm.role, status: 'Active' });
    }
    closeStaffModal();
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Emergency Announcement Preview */}
      {sysConfig.emergencyAlert && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium"><strong>System Broadcast Active:</strong> {sysConfig.emergencyMessage}</p>
          </div>
        </div>
      )}

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard title="Occupancy Rate" value="84.2%" subtitle="52 of 60 Rooms Booked" icon={Percent} trend={{ isPositive: true, value: '4.8% vs last week' }} />
        <StatCard title="Estimated Revenue" value="$24,850" subtitle="Today's Total Billing" icon={DollarSign} trend={{ isPositive: true, value: '12% vs targets' }} />
        <StatCard title="Active Reservations" value="142" subtitle="Current Stay & Upcoming" icon={BookOpen} trend={{ isPositive: false, value: '2 cancellations today' }} />
        <StatCard title="Maintenance Tickets" value={maintenanceLogs.filter(m => m.status !== 'Fixed' && m.status !== 'Resolved').length} subtitle="Open Work Orders" icon={AlertCircle} />
        <StatCard title="Average Daily Rate" value={adr} subtitle="Per Occupied Room" icon={TrendingUp} trend={{ isPositive: true, value: '3.1% WoW increase' }} />
        <StatCard title="Guest Feedback" value={`${avgFeedback} / 5.0`} subtitle={`${feedbackScores?.length || 0} Reviews Collected`} icon={Star} trend={{ isPositive: Number(avgFeedback) >= 4.5, value: Number(avgFeedback) >= 4.5 ? 'Above industry benchmark' : 'Below target threshold' }} />
      </div>

      {/* CSS-Based Analytics Visualizer */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Revenue & Occupancy Analytics</h2>
            <p className="text-xs text-slate-400">Financial output overview for the enterprise.</p>
          </div>
          <div className="flex gap-2">
            {['Daily', 'Weekly', 'Monthly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  timeframe === tf ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Grid Graph */}
        <div className="pt-6 pb-2">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-6 border-b border-slate-800 pb-2">
            {[
              { label: 'Mon', rev: 40, occ: 60 },
              { label: 'Tue', rev: 65, occ: 75 },
              { label: 'Wed', rev: 55, occ: 70 },
              { label: 'Thu', rev: 80, occ: 85 },
              { label: 'Fri', rev: 95, occ: 90 },
              { label: 'Sat', rev: 100, occ: 98 },
              { label: 'Sun', rev: 75, occ: 80 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[36px] flex items-end gap-1 h-full">
                  <div style={{ height: `${bar.rev}%` }} className="flex-1 bg-indigo-500 rounded-t-sm transition-all" title={`Revenue: ${bar.rev}%`} />
                  <div style={{ height: `${bar.occ}%` }} className="flex-1 bg-emerald-500/60 rounded-t-sm transition-all" title={`Occupancy: ${bar.occ}%`} />
                </div>
                <span className="text-[11px] text-slate-400">{bar.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <span className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block" /> Revenue Scale</span>
            <span className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 bg-emerald-500/60 rounded-sm inline-block" /> Occupancy %</span>
          </div>
        </div>
      </div>

      {/* Staff & User Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Staff Directory</h2>
            <p className="text-xs text-slate-400">Manage user authorization and staff roles.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none w-28 sm:w-36"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Housekeeping">Housekeeping</option>
            </select>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          </div>
        </div>

        {/* Data Table / Stacked Mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="bg-slate-800/50 uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="p-4">Staff ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-slate-400">{staff.id}</td>
                    <td className="p-4 font-semibold text-slate-100">{staff.name}</td>
                    <td className="p-4 text-slate-400">{staff.email}</td>
                    <td className="p-4">{staff.role}</td>
                    <td className="p-4"><Badge variant={staff.status}>{staff.status}</Badge></td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditStaff(staff)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors"
                          title="Edit staff"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleStaffStatus(staff.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            staff.status === 'Active'
                              ? 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={staff.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No staff members found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Global System Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-slate-100">Global System Configurations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">Dynamic Tax Rate (%)</label>
            <input
              type="number"
              value={sysConfig.taxRate}
              onChange={(e) => setSysConfig({ ...sysConfig, taxRate: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">Global Base Price Override ($)</label>
            <input
              type="number"
              step="5"
              value={sysConfig.basePriceOverride}
              onChange={(e) => {
                setSysConfig({ ...sysConfig, basePriceOverride: Number(e.target.value) });
                addToast(`Base price override set to $${e.target.value}. Affects all room pricing live.`, 'info');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">Applied additively to all room nightly rates.</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-slate-300 font-medium">Cancellation Policy Overview</label>
            <input
              type="text"
              value={sysConfig.cancellationPolicy}
              onChange={(e) => setSysConfig({ ...sysConfig, cancellationPolicy: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Emergency System Alert Banner</p>
                <p className="text-slate-400 text-[11px]">Display urgent notifications to all operational portals immediately.</p>
              </div>
              <input
                type="checkbox"
                checked={sysConfig.emergencyAlert}
                onChange={(e) => {
                  setSysConfig({ ...sysConfig, emergencyAlert: e.target.checked });
                  addToast(e.target.checked ? 'System alert enabled' : 'System alert disabled', 'warning');
                }}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
            {sysConfig.emergencyAlert && (
              <input
                type="text"
                value={sysConfig.emergencyMessage}
                onChange={(e) => setSysConfig({ ...sysConfig, emergencyMessage: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Type emergency alert notice..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Staff */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Sarah Connor"
                />
                {formErrors.name && <p className="text-rose-400 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="s.connor@luxurystay.com"
                />
                {formErrors.email && <p className="text-rose-400 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Operational Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Manager">Manager</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Housekeeping">Housekeeping</option>
                </select>
              </div>
              {!editingStaff && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  {formErrors.password && <p className="text-rose-400 mt-1">{formErrors.password}</p>}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeStaffModal}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingStaff ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};