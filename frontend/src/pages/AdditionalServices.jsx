import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import {
  Coffee,
  Sparkles,
  AlarmClockCheck,
  Car,
  Clock,
  CalendarClock,
  Send,
  Loader2,
  CheckCircle2,
  ChevronRight,
  UtensilsCrossed,
  User,
  Phone,
} from 'lucide-react';

// Additional Services page — guests can request:
//   1) Room service (menu items + time)
//   2) Wake-up call (date/time)
//   3) Transportation (airport transfer, vehicle type)
// Each request is sent to POST /api/services with graceful mock fallback.
export const AdditionalServices = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [tab, setTab] = useState('roomservice'); // roomservice | wakeup | transport
  const [submitting, setSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);

  // Room service state
  const [menuSelections, setMenuSelections] = useState({});
  const [rsTime, setRsTime] = useState('ASAP');
  const [rsNotes, setRsNotes] = useState('');

  const MENU = [
    { id: 'm1', name: 'Continental Breakfast', price: 25, desc: 'Pastries, fruit, juice, coffee', icon: Coffee, category: 'Breakfast' },
    { id: 'm2', name: 'Full English Breakfast', price: 32, desc: 'Eggs, bacon, sausage, toast, beans', icon: UtensilsCrossed, category: 'Breakfast' },
    { id: 'm3', name: 'Caesar Salad', price: 22, desc: 'Romaine, parmesan, croutons, dressing', icon: UtensilsCrossed, category: 'Lunch' },
    { id: 'm4', name: 'Grilled Salmon', price: 48, desc: 'Atlantic salmon, seasonal vegetables', icon: UtensilsCrossed, category: 'Dinner' },
    { id: 'm5', name: 'Wagyu Burger', price: 38, desc: 'Wagyu beef, cheddar, brioche, fries', icon: UtensilsCrossed, category: 'Dinner' },
    { id: 'm6', name: 'Cheesecake Slice', price: 14, desc: 'New York style with berries', icon: Coffee, category: 'Dessert' },
    { id: 'm7', name: 'Champagne (750ml)', price: 95, desc: 'Moët & Chandon Impérial', icon: Coffee, category: 'Beverage' },
    { id: 'm8', name: 'Premium Water Pack', price: 8, desc: '2x Evian 1L + sparkling + still', icon: Coffee, category: 'Beverage' },
  ];

  // Wake-up call state
  const [wuDate, setWuDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [wuTime, setWuTime] = useState('07:00');
  const [wuGuest, setWuGuest] = useState(user?.name || '');
  const [wuNotes, setWuNotes] = useState('');

  // Transportation state
  const [tpType, setTpType] = useState('Airport Pickup');
  const [tpVehicle, setTpVehicle] = useState('Sedan');
  const [tpDate, setTpDate] = useState(new Date().toISOString().slice(0, 10));
  const [tpTime, setTpTime] = useState('14:00');
  const [tpFrom, setTpFrom] = useState('JFK International Airport');
  const [tpTo, setTpTo] = useState('LuxuryStay Downtown');
  const [tpGuests, setTpGuests] = useState(2);
  const [tpNotes, setTpNotes] = useState('');

  const PRICE_BY_VEHICLE = {
    Sedan: 60,
    SUV: 85,
    Van: 120,
    Limousine: 220,
  };

  // Summary calculations
  const roomServiceTotal = Object.entries(menuSelections).reduce((sum, [id, qty]) => {
    const item = MENU.find((m) => m.id === id);
    return sum + (item?.price || 0) * (qty || 0);
  }, 0);
  const transportTotal = PRICE_BY_VEHICLE[tpVehicle] || 0;

  const setQty = (id, delta) => {
    setMenuSelections((prev) => {
      const next = { ...prev };
      const cur = next[id] || 0;
      const newVal = Math.max(0, cur + delta);
      if (newVal === 0) delete next[id];
      else next[id] = newVal;
      return next;
    });
  };

  const submit = async (payload, typeLabel) => {
    try {
      setSubmitting(true);
      await api.post('/services', { ...payload, type: typeLabel }).catch(() => {});
      setLastRequest({
        type: typeLabel,
        ref: `SVC-${Date.now()}`,
        at: new Date().toLocaleString(),
      });
      addToast(`${typeLabel} request submitted successfully!`, 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRoomService = (e) => {
    e.preventDefault();
    const items = Object.entries(menuSelections)
      .map(([id, qty]) => {
        const m = MENU.find((x) => x.id === id);
        return m ? { id, name: m.name, qty, price: m.price } : null;
      })
      .filter(Boolean);
    if (items.length === 0) {
      addToast('Please select at least one menu item.', 'warning');
      return;
    }
    submit(
      {
        items,
        total: roomServiceTotal,
        deliveryTime: rsTime,
        notes: rsNotes,
        guest: user?.name || wuGuest,
      },
      'Room Service'
    );
  };

  const submitWakeup = (e) => {
    e.preventDefault();
    if (!wuGuest.trim()) {
      addToast('Guest name required for wake-up call.', 'warning');
      return;
    }
    submit(
      {
        date: wuDate,
        time: wuTime,
        guestName: wuGuest,
        notes: wuNotes,
      },
      'Wake-up Call'
    );
  };

  const submitTransport = (e) => {
    e.preventDefault();
    if (!tpFrom.trim() || !tpTo.trim()) {
      addToast('Pickup and destination required.', 'warning');
      return;
    }
    submit(
      {
        type: tpType,
        vehicle: tpVehicle,
        date: tpDate,
        time: tpTime,
        from: tpFrom,
        to: tpTo,
        guests: tpGuests,
        notes: tpNotes,
        price: transportTotal,
      },
      'Transportation'
    );
  };

  // ========== UI helpers ==========
  const TabBtn = ({ k, label, icon: Icon }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => setTab(k)}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
          active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
        }`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" /> Additional Services
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Room service, wake-up calls, and transportation — at your service.
        </p>
      </div>

      {lastRequest && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-300">
              {lastRequest.type} Request Confirmed
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref #{lastRequest.ref} • {lastRequest.at}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        <TabBtn k="roomservice" label="Room Service" icon={Coffee} />
        <TabBtn k="wakeup" label="Wake-up Call" icon={AlarmClockCheck} />
        <TabBtn k="transport" label="Transportation" icon={Car} />
      </div>

      {/* ================== ROOM SERVICE TAB ================== */}
      {tab === 'roomservice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" /> Room Service Menu
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Tap + to add items. 24/7 in-room dining.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MENU.map((m) => {
                const Icon = m.icon;
                const qty = menuSelections[m.id] || 0;
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border transition-all ${
                      qty > 0
                        ? 'bg-indigo-600/10 border-indigo-500/40'
                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100">{m.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                            {m.desc}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600 mt-1">
                            {m.category}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-emerald-400 flex-shrink-0">
                        ${m.price}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                      <span className="text-[11px] text-slate-500">Qty</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(m.id, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-100">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(m.id, 1)}
                          className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary sidebar */}
          <form
            onSubmit={submitRoomService}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit sticky top-20 space-y-4 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
              Order Summary
            </h3>

            {Object.keys(menuSelections).length === 0 ? (
              <div className="py-6 text-center text-slate-500">
                <Coffee className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Your tray is empty.</p>
                <p className="text-[11px] mt-0.5">Add items from the menu.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {Object.entries(menuSelections).map(([id, qty]) => {
                  const m = MENU.find((x) => x.id === id);
                  if (!m) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {qty} × ${m.price}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-slate-100 ml-3">
                        ${(qty * m.price).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Delivery Time
                </label>
                <select
                  value={rsTime}
                  onChange={(e) => setRsTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ASAP">ASAP (15-25 min)</option>
                  <option value="30">In 30 minutes</option>
                  <option value="60">In 1 hour</option>
                  <option value="custom">Custom time...</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={rsNotes}
                  onChange={(e) => setRsNotes(e.target.value)}
                  placeholder="e.g. no onions, extra napkins, knock softly..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">Subtotal</div>
              <div className="flex justify-between text-slate-200">
                <span>Room Service</span>
                <span className="font-semibold">${roomServiceTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service charge (15%)</span>
                <span>${Math.round(roomServiceTotal * 0.15).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-emerald-400 pt-2 border-t border-slate-700">
                <span>Total</span>
                <span>${Math.round(roomServiceTotal * 1.15).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || roomServiceTotal === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Place Order
            </button>
          </form>
        </div>
      )}

      {/* ================== WAKE-UP CALL TAB ================== */}
      {tab === 'wakeup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlarmClockCheck className="w-5 h-5 text-indigo-400" />
              Schedule Wake-up Call
            </h2>
            <form onSubmit={submitWakeup} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" /> Date
                  </label>
                  <input
                    type="date"
                    value={wuDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setWuDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Time
                  </label>
                  <input
                    type="time"
                    value={wuTime}
                    onChange={(e) => setWuTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Guest Name *
                </label>
                <input
                  type="text"
                  value={wuGuest}
                  onChange={(e) => setWuGuest(e.target.value)}
                  placeholder="Name of guest to call"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Special Instructions (optional)
                </label>
                <textarea
                  rows={3}
                  value={wuNotes}
                  onChange={(e) => setWuNotes(e.target.value)}
                  placeholder="e.g. 2nd ring, ask for room 412, Spanish-speaking..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlarmClockCheck className="w-4 h-4" />
                  )}
                  Schedule Wake-up Call
                </button>
              </div>
            </form>
          </div>

          {/* Preview card */}
          <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-slate-400">
              Preview
            </h3>
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center mx-auto">
                <AlarmClockCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Will call</p>
                <p className="text-3xl font-bold text-white mt-1">{wuTime || '--:--'}</p>
                <p className="text-sm text-slate-400 mt-1">
                  on {wuDate || '----/--/--'}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest</span>
                  <span className="text-slate-200 font-medium">{wuGuest || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Notes</span>
                  <span className="text-slate-200 text-right max-w-[60%] truncate">
                    {wuNotes || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== TRANSPORTATION TAB ================== */}
      {tab === 'transport' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={submitTransport}
            className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-xs"
          >
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              Request Transportation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Trip Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Airport Pickup', 'Airport Drop-off', 'Charter (By Hour)'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTpType(t)}
                      className={`p-2.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                        tpType === t
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Vehicle</label>
                <select
                  value={tpVehicle}
                  onChange={(e) => setTpVehicle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  {Object.keys(PRICE_BY_VEHICLE).map((v) => (
                    <option key={v}>
                      {v} — ${PRICE_BY_VEHICLE[v]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={tpGuests}
                  onChange={(e) => setTpGuests(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> Date
                </label>
                <input
                  type="date"
                  value={tpDate}
                  onChange={(e) => setTpDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Time
                </label>
                <input
                  type="time"
                  value={tpTime}
                  onChange={(e) => setTpTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" /> Pickup Location
                </label>
                <input
                  type="text"
                  value={tpFrom}
                  onChange={(e) => setTpFrom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5" /> Destination
                </label>
                <input
                  type="text"
                  value={tpTo}
                  onChange={(e) => setTpTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Primary Contact
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  readOnly
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </label>
                <input
                  type="tel"
                  value={user?.email ? '' : ''}
                  placeholder="+1 555 000 0000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={tpNotes}
                  onChange={(e) => setTpNotes(e.target.value)}
                  placeholder="Child seat, extra luggage, meet & greet, etc."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Car className="w-4 h-4" />
                )}
                Book Transport
              </button>
            </div>
          </form>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit sticky top-20 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
              Booking Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                <Car className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-100">{tpType}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tpVehicle} • {tpGuests} passenger{tpGuests > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="text-slate-200 font-medium">
                    {tpDate} {tpTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">From</span>
                  <span className="text-slate-200 max-w-[60%] text-right truncate">
                    {tpFrom || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">To</span>
                  <span className="text-slate-200 max-w-[60%] text-right truncate">
                    {tpTo || '—'}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Vehicle Fee</span>
                <span className="font-semibold">${transportTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gratuity (20%)</span>
                <span>${Math.round(transportTotal * 0.2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-emerald-400 pt-2 border-t border-slate-700">
                <span>Total</span>
                <span>${Math.round(transportTotal * 1.2).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
