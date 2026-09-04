import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import { Plus, Search, Pencil, BedDouble, Loader2, X, DollarSign, Layers } from 'lucide-react';

// Room Management page — view all rooms with status, add/edit rooms.
export const RoomManagement = () => {
  const { rooms, getEffectiveRoomPrice, addToast, sysConfig } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  const [roomForm, setRoomForm] = useState({
    number: '',
    type: 'Standard',
    floor: '1st Floor',
    price: 180,
    status: 'Available',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        await api.get('/rooms');
      } catch (e) {
        /* fallback to mock data in AppContext */
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const ROOM_TYPES = ['Standard', 'Deluxe', 'Executive Suite', 'Presidential Suite'];
  const ROOM_STATUSES = ['Available', 'Occupied', 'Needs Cleaning', 'Maintenance'];

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.number.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.floor.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: rooms.length, available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
    rooms.forEach((r) => {
      if (r.status === 'Available') c.available++;
      else if (r.status === 'Occupied') c.occupied++;
      else if (r.status === 'Needs Cleaning') c.cleaning++;
      else if (r.status === 'Maintenance') c.maintenance++;
    });
    return c;
  }, [rooms]);

  const openAdd = () => {
    setEditingRoom(null);
    setRoomForm({
      number: '',
      type: 'Standard',
      floor: '1st Floor',
      price: 180,
      status: 'Available',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setRoomForm({ ...room });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!roomForm.number.trim()) errs.number = 'Room number is required';
    if (roomForm.price <= 0) errs.price = 'Price must be greater than 0';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    try {
      setLoading(true);
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, roomForm).catch(() => {});
        // Update in context via addToast + setRooms — simple approach for student project:
        addToast(`Room ${roomForm.number} updated.`, 'success');
        // Reload page — simple way to refresh (in real app, use setRooms)
        setTimeout(() => window.location.reload(), 600);
      } else {
        await api.post('/rooms', roomForm).catch(() => {});
        addToast(`Room ${roomForm.number} added.`, 'success');
        setTimeout(() => window.location.reload(), 600);
      }
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-xl font-bold text-slate-100">Room Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage room inventory, pricing, and status.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatPill label="Total Rooms" value={counts.total} tone="indigo" icon={Layers} />
        <StatPill label="Available" value={counts.available} tone="emerald" icon={BedDouble} />
        <StatPill label="Occupied" value={counts.occupied} tone="rose" icon={BedDouble} />
        <StatPill label="Cleaning" value={counts.cleaning} tone="amber" icon={BedDouble} />
        <StatPill label="Maintenance" value={counts.maintenance} tone="rose" icon={BedDouble} />
      </div>

      {/* Table card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-100">Room Inventory</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none w-28 sm:w-36"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {ROOM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Room
            </button>
          </div>
        </div>

        {loading && rooms.length === 0 ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="ml-3 text-sm text-slate-400">Loading rooms...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="p-4">Room #</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Floor</th>
                  <th className="p-4">Nightly Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-100">#{r.number}</td>
                      <td className="p-4">{r.type}</td>
                      <td className="p-4 text-slate-400">{r.floor}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {getEffectiveRoomPrice(r).toLocaleString()}
                        </div>
                        {sysConfig?.basePriceOverride ? (
                          <p className="text-[10px] text-slate-500">
                            base ${r.price} + override ${sysConfig.basePriceOverride}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <Badge variant={r.status}>{r.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No rooms match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingRoom ? `Edit Room #${editingRoom.number}` : 'Add New Room'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Room #</label>
                  <input
                    type="text"
                    value={roomForm.number}
                    onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 401"
                  />
                  {errors.number && <p className="text-rose-400 mt-1">{errors.number}</p>}
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Floor</label>
                  <input
                    type="text"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="1st Floor"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Type</label>
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="10"
                    value={roomForm.price}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, price: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.price && <p className="text-rose-400 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {ROOM_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Saving...' : editingRoom ? 'Save Changes' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
