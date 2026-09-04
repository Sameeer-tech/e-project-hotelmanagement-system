import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import {
  LogIn,
  LogOut,
  CalendarDays,
  User,
  Phone,
  KeyRound,
  CheckCircle2,
  Loader2,
  Search,
} from 'lucide-react';

// Check-in / Check-out page — shows today's arrivals and departures.
// Receptionists can click a button to check a guest in (room becomes Occupied)
// or check them out (room becomes Needs Cleaning).
export const CheckInOut = () => {
  const { rooms, updateRoomStatus, addToast } = useApp();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('arrivals'); // arrivals | departures
  const [search, setSearch] = useState('');

  // Mock booking data for demo.
  const [bookings, setBookings] = useState([]);

  // Build today's demo arrivals / departures from rooms + mock guest data.
  const initialBookings = useMemo(() => {
    const arrivals = rooms
      .filter((r) => r.status === 'Available')
      .slice(0, 3)
      .map((r, i) => ({
        id: `BK-IN-${r.id}`,
        reference: `BK-2026-${1000 + i}`,
        guestName: ['Jonathan Pierce', 'Aisha Rahman', 'Marco Rossi'][i],
        email: `guest${i + 1}@email.com`,
        phone: `+1 555 ${200 + i} ${1000 + i}`,
        room: r,
        checkIn: new Date().toISOString().slice(0, 10),
        checkOut: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        status: 'Pending',
        nights: 2,
      }));

    const departures = rooms
      .filter((r) => r.status === 'Occupied')
      .slice(0, 2)
      .map((r, i) => ({
        id: `BK-OUT-${r.id}`,
        reference: `BK-2026-${2000 + i}`,
        guestName: ['Priya Patel', 'Daniel Kim'][i],
        email: `dep${i + 1}@email.com`,
        phone: `+1 555 ${300 + i} ${2000 + i}`,
        room: r,
        checkIn: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
        checkOut: new Date().toISOString().slice(0, 10),
        status: 'Checked In',
        nights: 2,
      }));

    return [...arrivals, ...departures];
  }, [rooms]);

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        setLoading(true);
        await api.get('/bookings/today').catch(() => {});
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  const arrivals = bookings.filter(
    (b) => b.status === 'Pending' || b.status === 'Checked In'
  );
  const departures = bookings.filter(
    (b) => b.status === 'Checked In' || b.status === 'Checked Out'
  );
  const displayList = tab === 'arrivals' ? arrivals : departures;

  const filteredList = displayList.filter(
    (b) =>
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.room.number.includes(search) ||
      b.reference.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckIn = async (booking) => {
    try {
      setLoading(true);
      await api.patch(`/bookings/${booking.id}/checkin`).catch(() => {});
      updateRoomStatus(booking.room.number, 'Occupied');
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'Checked In' } : b))
      );
      addToast(`${booking.guestName} checked into Room #${booking.room.number}.`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (booking) => {
    try {
      setLoading(true);
      await api.patch(`/bookings/${booking.id}/checkout`).catch(() => {});
      updateRoomStatus(booking.room.number, 'Needs Cleaning');
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'Checked Out' } : b))
      );
      addToast(`${booking.guestName} checked out. Room sent for cleaning.`, 'info');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      arrivals: bookings.filter((b) => b.status === 'Pending').length,
      inHouse: bookings.filter((b) => b.status === 'Checked In').length,
      departures: bookings.filter((b) => b.status === 'Checked Out').length,
    };
  }, [bookings]);

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

  const BookingCard = ({ booking }) => {
    const isArrival = booking.status === 'Pending';
    const isDepartureReady = booking.status === 'Checked In' && tab === 'departures';
    const isDone = booking.status === 'Checked Out' || booking.status === 'Checked In' && tab === 'arrivals';

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {booking.reference}
            </p>
            <h3 className="text-lg font-bold text-slate-100 mt-0.5">{booking.guestName}</h3>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {booking.phone}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> {booking.nights} night
                {booking.nights > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <Badge variant={booking.status}>{booking.status}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Room</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              #{booking.room.number}
            </p>
            <p className="text-[11px] text-slate-400">{booking.room.type}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Check-in</p>
            <p className="text-sm text-slate-200 mt-0.5 font-medium">{booking.checkIn}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Check-out</p>
            <p className="text-sm text-slate-200 mt-0.5 font-medium">{booking.checkOut}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          {isArrival && (
            <button
              onClick={() => handleCheckIn(booking)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              Check In
            </button>
          )}
          {isDepartureReady && (
            <button
              onClick={() => handleCheckOut(booking)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Check Out
            </button>
          )}
          {isDone && (
            <span className="text-xs text-slate-500 italic">No action pending</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Check-in / Check-out</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage today's arrivals and departures.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatPill label="Arrivals Today" value={stats.arrivals} tone="emerald" icon={LogIn} />
        <StatPill label="Guests In-House" value={stats.inHouse} tone="indigo" icon={User} />
        <StatPill label="Departures Today" value={stats.departures} tone="amber" icon={LogOut} />
      </div>

      {/* Tabs + search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-fit">
            {[
              { k: 'arrivals', label: 'Arrivals', icon: LogIn },
              { k: 'departures', label: 'Departures', icon: LogOut },
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
          <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search guest, room, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full sm:w-56"
            />
          </div>
        </div>

        <div className="p-5">
          {loading && filteredList.length === 0 ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="ml-3 text-sm text-slate-400">Loading...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300 mb-1">
                No {tab} for this criteria.
              </p>
              <p className="text-xs text-slate-500">
                Try a different search term or check the other tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
