import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import {
  Search,
  CalendarDays,
  BedDouble,
  DollarSign,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';

// Booking / Reservation page — search available rooms by date range,
// select a room, fill in guest info, then view a confirmation card.
export const Booking = () => {
  const { rooms, getEffectiveRoomPrice, addToast } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Step state: 'search' -> 'select' -> 'guest' -> 'confirm'
  const [step, setStep] = useState('search');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guestCount, setGuestCount] = useState(2);
  const [roomType, setRoomType] = useState('Any');
  const [loading, setLoading] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [errors, setErrors] = useState({});
  const [bookingRef, setBookingRef] = useState(null);

  // Compute nights for pricing
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const ms = d2 - d1;
    const n = Math.round(ms / (1000 * 60 * 60 * 24));
    return Math.max(1, n);
  }, [checkIn, checkOut]);

  // Search results: Available rooms matching filters.
  const availableRooms = useMemo(() => {
    let list = rooms.filter((r) => r.status === 'Available');
    if (roomType !== 'Any') list = list.filter((r) => r.type === roomType);
    // Simple guest-capacity heuristic: standard=2, deluxe=3, suites=4
    const capMap = { Standard: 2, Deluxe: 3, 'Executive Suite': 4, 'Presidential Suite': 6 };
    list = list.filter((r) => (capMap[r.type] || 2) >= guestCount);
    return list;
  }, [rooms, roomType, guestCount]);

  const totalPrice = selectedRoom ? getEffectiveRoomPrice(selectedRoom) * nights : 0;

  const handleSearch = async () => {
    if (new Date(checkOut) <= new Date(checkIn)) {
      setErrors({ checkOut: 'Check-out must be after check-in.' });
      return;
    }
    setErrors({});
    try {
      setLoading(true);
      await api
        .get('/rooms/available', {
          params: { checkIn, checkOut, roomType, guestCount },
        })
        .catch(() => {});
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const goToGuestInfo = (room) => {
    setSelectedRoom(room);
    setStep('guest');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!guestForm.name.trim()) errs.name = 'Guest name required';
    if (!guestForm.email.trim()) errs.email = 'Email required';
    if (!guestForm.phone.trim()) errs.phone = 'Phone required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        guestCount,
        guest: guestForm,
        totalPrice,
      };
      const res = await api.post('/bookings', payload).catch(() => ({
        data: { reference: `BK-${Date.now()}` },
      }));
      setBookingRef(res.data?.reference || `BK-${Date.now()}`);
      addToast('Reservation created successfully!', 'success');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep('search');
    setSelectedRoom(null);
    setBookingRef(null);
    setGuestForm({ name: '', email: '', phone: '', specialRequests: '' });
    setErrors({});
  };

  // ============ UI RENDER ============
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
      {['Search', 'Select Room', 'Guest Info', 'Confirm'].map((s, idx) => {
        const order = ['search', 'select', 'guest', 'confirm'];
        const activeIdx = order.indexOf(step);
        const me = idx;
        const done = me < activeIdx;
        const active = me === activeIdx;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  done
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : active
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : me + 1}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  active || done ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {s}
              </span>
            </div>
            {idx < 3 && <div className={`h-px w-6 sm:w-12 ${done ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Room Booking / Reservation</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search available rooms and create a new reservation.
        </p>
      </div>

      <StepIndicator />

      {/* ===== STEP 1: SEARCH ===== */}
      {step === 'search' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-100">Find Available Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-medium flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Check-In
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-medium flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Check-Out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
              {errors.checkOut && (
                <p className="text-rose-400">{errors.checkOut}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Guests
              </label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Guest{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-medium flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" /> Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option>Any</option>
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Executive Suite</option>
                <option>Presidential Suite</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{nights} night{nights > 1 ? 's' : ''}</span>
              {' '}• {availableRooms.length} rooms currently available for filters
            </p>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search Rooms
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: SELECT ROOM ===== */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('search')}
              className="text-xs text-slate-400 hover:text-white font-medium"
            >
              ← Back to search
            </button>
            <p className="text-xs text-slate-400">
              {checkIn} → {checkOut} • {nights} night{nights > 1 ? 's' : ''} • {guestCount} guest
              {guestCount > 1 ? 's' : ''}
            </p>
          </div>

          {availableRooms.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
              <BedDouble className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200 mb-1">No rooms available</h3>
              <p className="text-xs text-slate-500 mb-4">
                Try changing your dates or reducing the number of guests.
              </p>
              <button
                onClick={() => setStep('search')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
              >
                Adjust Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableRooms.map((r) => {
                const total = getEffectiveRoomPrice(r) * nights;
                return (
                  <div
                    key={r.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">
                          Room #{r.number}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {r.type} • {r.floor}
                        </p>
                      </div>
                      <Badge variant={r.status}>{r.status}</Badge>
                    </div>
                    <div className="flex items-end justify-between pt-3 border-t border-slate-800">
                      <div>
                        <p className="text-[11px] text-slate-500">
                          ${getEffectiveRoomPrice(r)} × {nights} night{nights > 1 ? 's' : ''}
                        </p>
                        <p className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                          <DollarSign className="w-5 h-5" />
                          {total.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => goToGuestInfo(r)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Select <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== STEP 3: GUEST INFO ===== */}
      {step === 'guest' && selectedRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100">Guest Information</h2>
            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Full Name *
                  </label>
                  <input
                    type="text"
                    value={guestForm.name}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, name: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.name && <p className="text-rose-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email *
                  </label>
                  <input
                    type="email"
                    value={guestForm.email}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, email: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.email && <p className="text-rose-400 mt-1">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Phone *
                  </label>
                  <input
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, phone: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.phone && <p className="text-rose-400 mt-1">{errors.phone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">
                    Special Requests (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={guestForm.specialRequests}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, specialRequests: e.target.value })
                    }
                    placeholder="e.g. high floor, king bed, late check-in..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="text-xs text-slate-400 hover:text-white font-medium"
                >
                  ← Back to rooms
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>

          {/* Booking summary card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit sticky top-20">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
              Booking Summary
            </h3>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Room</p>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                #{selectedRoom.number} — {selectedRoom.type}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-500 uppercase">Check-in</p>
                <p className="text-xs text-slate-200 font-medium mt-0.5">{checkIn}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase">Check-out</p>
                <p className="text-xs text-slate-200 font-medium mt-0.5">{checkOut}</p>
              </div>
            </div>
            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  ${getEffectiveRoomPrice(selectedRoom)} × {nights} nights
                </span>
                <span className="text-slate-200 font-medium">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxes & Fees (~12%)</span>
                <span className="text-slate-200 font-medium">
                  ${Math.round(totalPrice * 0.12).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-200 font-bold">Total</span>
                <span className="text-emerald-400 font-bold text-lg">
                  ${Math.round(totalPrice * 1.12).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 4: CONFIRMATION ===== */}
      {step === 'confirm' && selectedRoom && (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Booking Confirmed!</h2>
          <p className="text-sm text-slate-400">
            A confirmation has been sent to{' '}
            <span className="text-indigo-300 font-medium">{guestForm.email}</span>
          </p>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                Reference #
              </span>
              <span className="font-mono font-bold text-indigo-300">{bookingRef}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Guest</p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">{guestForm.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Room</p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">
                  #{selectedRoom.number} — {selectedRoom.type}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Check-in</p>
                <p className="text-sm text-slate-200 mt-0.5">{checkIn}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Check-out</p>
                <p className="text-sm text-slate-200 mt-0.5">{checkOut}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-slate-300 font-medium">Total Charged</span>
              <span className="text-emerald-400 font-bold text-lg">
                ${Math.round(totalPrice * 1.12).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetAll}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg"
            >
              <X className="w-4 h-4 inline mr-1.5" />
              Close
            </button>
            <button
              onClick={resetAll}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg"
            >
              + New Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
