import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Loader2,
  Send,
} from 'lucide-react';

// Housekeeping page:
// 1) List of rooms with cleaning status + "mark cleaned" button.
// 2) A form to report a new maintenance issue (routed to Maintenance log).
export const Housekeeping = () => {
  const { rooms, tasks, updateRoomStatus, moveTaskStatus, addMaintenanceLog, addToast, maintenanceLogs } = useApp();

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('cleaning'); // cleaning | maintenance

  // Maintenance issue form
  const [form, setForm] = useState({
    room: rooms[0]?.number || '',
    category: 'HVAC',
    priority: 'Medium',
    description: '',
    reportedBy: 'Housekeeping',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        await api.get('/housekeeping/tasks').catch(() => {});
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Build room-cleaning list: include rooms that are Needs Cleaning + any tasks.
  const cleaningList = useMemo(() => {
    const fromRooms = rooms
      .filter((r) => r.status === 'Needs Cleaning' || r.status === 'Occupied' || r.status === 'Available')
      .map((r) => {
        // Map room.status to a cleaning-status label
        let cleanStatus = 'Clean';
        if (r.status === 'Needs Cleaning') cleanStatus = 'Dirty';
        else if (r.status === 'Occupied') cleanStatus = 'Stayover';
        // Match with task if present
        const match = tasks.find((t) => t.room === r.number);
        return {
          key: `r-${r.id}`,
          roomNumber: r.number,
          roomType: r.type,
          floor: r.floor,
          status: match ? match.status : cleanStatus,
          assignedTo: match?.assignedTo || 'Unassigned',
          priority: match?.priority || (cleanStatus === 'Dirty' ? 'High' : 'Low'),
        };
      });
    return fromRooms;
  }, [rooms, tasks]);

  const filteredCleaning = cleaningList.filter(
    (c) =>
      c.roomNumber.includes(search) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleMarkCleaned = async (item) => {
    try {
      setLoading(true);
      await api.patch(`/housekeeping/${item.roomNumber}`).catch(() => {});
      // Move the task in AppContext if there is one
      const task = tasks.find((t) => t.room === item.roomNumber);
      if (task) {
        moveTaskStatus(task.id, 'Inspected');
      }
      // Also update room status if it was Needs Cleaning
      const room = rooms.find((r) => r.number === item.roomNumber);
      if (room && room.status === 'Needs Cleaning') {
        updateRoomStatus(room.number, 'Available');
      }
      addToast(`Room ${item.roomNumber} marked as cleaned.`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.room) errs.room = 'Room is required';
    if (!form.description.trim()) errs.description = 'Description required';
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    try {
      setLoading(true);
      await api.post('/maintenance', form).catch(() => {});
      addMaintenanceLog({ ...form });
      addToast(`Maintenance ticket logged for Room ${form.room}.`, 'warning');
      setForm({ ...form, description: '' });
      setFormErrors({});
      setTab('maintenance');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'Dirty':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'In Progress':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Inspected':
      case 'Clean':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Stayover':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-700';
    }
  };

  const priorityBadge = (p) => {
    switch (p) {
      case 'High':
      case 'Urgent':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Low':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return '';
    }
  };

  const cleaningStats = useMemo(() => {
    const dirty = cleaningList.filter((c) => c.status === 'Dirty').length;
    const inProgress = cleaningList.filter((c) => c.status === 'In Progress').length;
    const clean = cleaningList.filter(
      (c) => c.status === 'Clean' || c.status === 'Inspected'
    ).length;
    return { dirty, inProgress, clean, total: cleaningList.length };
  }, [cleaningList]);

  const StatPill = ({ label, value, tone, icon: Icon }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          tone === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-400'
            : tone === 'rose'
            ? 'bg-rose-500/15 text-rose-400'
            : tone === 'amber'
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-indigo-500/15 text-indigo-400'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-100">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Housekeeping & Maintenance</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track room cleaning status and log maintenance issues.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatPill label="Total Rooms" value={cleaningStats.total} tone="indigo" icon={Sparkles} />
        <StatPill label="Dirty / To Clean" value={cleaningStats.dirty} tone="rose" icon={AlertTriangle} />
        <StatPill label="In Progress" value={cleaningStats.inProgress} tone="amber" icon={Sparkles} />
        <StatPill label="Clean / Ready" value={cleaningStats.clean} tone="emerald" icon={CheckCircle2} />
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 px-4 pt-4">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit">
            {[
              { k: 'cleaning', label: 'Room Cleaning', icon: Sparkles },
              { k: 'maintenance', label: 'Maintenance', icon: Wrench },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === 'cleaning' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search room / status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
              />
            </div>

            {loading && filteredCleaning.length === 0 ? (
              <div className="p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="ml-3 text-sm text-slate-400">Loading tasks...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredCleaning.map((item) => {
                  const done = item.status === 'Clean' || item.status === 'Inspected';
                  return (
                    <div
                      key={item.key}
                      className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100">
                            Room #{item.roomNumber}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {item.roomType} • {item.floor}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-md border font-semibold ${statusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mb-3">
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider">Assigned</p>
                          <p className="text-slate-200 font-medium mt-0.5">
                            {item.assignedTo}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 uppercase tracking-wider">Priority</p>
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-semibold mt-0.5 ${priorityBadge(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkCleaned(item)}
                        disabled={loading || done}
                        className={`w-full py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                          done
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {done ? '✓ Cleaned' : 'Mark as Cleaned'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'maintenance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Report form */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Report Maintenance Issue
              </h2>
              <form onSubmit={handleMaintenanceSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Room #</label>
                    <select
                      value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.number}>
                          #{r.number} — {r.type}
                        </option>
                      ))}
                    </select>
                    {formErrors.room && (
                      <p className="text-rose-400 mt-1">{formErrors.room}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option>HVAC</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Furniture</option>
                      <option>Appliance</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Reported By</label>
                    <input
                      type="text"
                      value={form.reportedBy}
                      onChange={(e) =>
                        setForm({ ...form, reportedBy: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Description *</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe the issue in detail..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {formErrors.description && (
                    <p className="text-rose-400 mt-1">{formErrors.description}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Submit Ticket
                </button>
              </form>
            </div>

            {/* Maintenance log */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-slate-100">Open Tickets</h2>
                <Badge variant="Inactive">{maintenanceLogs.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {maintenanceLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 p-6 text-center bg-slate-800/20 rounded-lg border border-slate-800">
                    No maintenance tickets.
                  </p>
                ) : (
                  maintenanceLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-slate-800/30 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono text-[11px] text-slate-500">{log.id}</p>
                          <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                            Room #{log.room} • {log.category}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${priorityBadge(
                              log.priority
                            )}`}
                          >
                            {log.priority}
                          </span>
                          <Badge variant={log.status}>{log.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
