import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Search, Plus, Key, LogOut, Printer, Mail, Minus, Wifi, Tv, Coffee, Utensils, Sparkles, Car, Clock, CheckCircle2, FileText, ShieldAlert } from 'lucide-react';

const ROOM_AMENITIES = {
  Standard: ['WiFi', 'HD TV', 'Coffee Maker'],
  Deluxe: ['WiFi', 'HD TV', 'Coffee Maker', 'Room Service', 'Balcony'],
  'Executive Suite': ['WiFi', '4K Smart TV', 'Espresso Machine', 'Butler Service', 'Whirlpool Tub', 'Priority Concierge'],
};

export const ReceptionistPortal = () => {
  const { rooms, updateRoomStatus, sysConfig, addToast, getEffectiveRoomPrice } = useApp();

  // Filters State
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchNum, setSearchNum] = useState('');

  // Operations Modals State
  const [activeModal, setActiveModal] = useState(null); // 'res' | 'checkin' | 'checkout' | 'confirm' | 'invoice'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);

  // Form & Operations State
  const [resForm, setResForm] = useState({ guestName: '', roomNum: '101', checkIn: '', checkOut: '', payment: 'Credit Card', nights: 3 });
  const [keyCardId, setKeyCardId] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // CheckOut editable charges state
  const [charges, setCharges] = useState([
    { id: 'dining', label: 'In-Room Dining / Services', amount: 65 },
    { id: 'laundry', label: 'Laundry & Dry Cleaning', amount: 0 },
    { id: 'spa', label: 'Spa & Wellness', amount: 0 },
    { id: 'minibar', label: 'Mini-Bar Restock', amount: 0 },
    { id: 'taxi', label: 'Airport / Transport', amount: 0 },
  ]);
  const [nights, setNights] = useState(3);

  const addCharge = () => {
    setCharges((c) => [...c, { id: `custom-${Date.now()}`, label: 'Custom Charge', amount: 0 }]);
  };
  const updateCharge = (id, field, value) => {
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: field === 'amount' ? Number(value) || 0 : value } : c))
    );
  };
  const removeCharge = (id) => {
    setCharges((prev) => prev.filter((c) => c.id !== id));
  };
  const extrasTotal = charges.reduce((s, c) => s + Number(c.amount || 0), 0);
  const roomRate = selectedRoom ? getEffectiveRoomPrice(selectedRoom) : 0;
  const roomTotal = Number(roomRate) * Number(nights);
  const subtotal = roomTotal + extrasTotal;
  const taxAmt = subtotal * (Number(sysConfig.taxRate || 0) / 100);
  const grandTotal = subtotal + taxAmt;

  // Dynamic Room Filter
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchNum = r.number.includes(searchNum);
      const matchType = filterType === 'All' || r.type === filterType;
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchNum && matchType && matchStatus;
    });
  }, [rooms, searchNum, filterType, filterStatus]);

  const handleCreateReservation = (e) => {
    e.preventDefault();
    updateRoomStatus(resForm.roomNum, 'Occupied');
    const n = Number(resForm.nights) || 3;
    const booked = rooms.find((r) => r.number === resForm.roomNum);
    setConfirmedBooking({
      guest: resForm.guestName,
      room: booked,
      checkIn: resForm.checkIn,
      checkOut: resForm.checkOut,
      nights: n,
      payment: resForm.payment,
      total: (getEffectiveRoomPrice(booked) * n).toFixed(2),
      confirmation: `LX-${Date.now().toString().slice(-6)}`,
    });
    setActiveModal('confirm');
  };

  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    if (!keyCardId) return;
    updateRoomStatus(selectedRoom.number, 'Occupied');
    addToast(`Guest checked in to Room ${selectedRoom.number} (Keycard #${keyCardId}).`, 'success');
    setActiveModal(null);
  };

  const handleCheckOutSubmit = () => {
    updateRoomStatus(selectedRoom.number, 'Needs Cleaning');
    setLastInvoice({
      guest: 'Current Guest',
      room: selectedRoom,
      nights,
      charges,
      extrasTotal,
      roomTotal,
      subtotal,
      taxAmt,
      grandTotal,
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      issued: new Date().toLocaleDateString(),
    });
    setActiveModal('invoice');
    addToast(`Check-out complete for Room ${selectedRoom.number}. Invoice generated.`, 'success');
  };

  const openCheckOut = (room) => {
    setSelectedRoom(room);
    setNights(3);
    setIsPaid(false);
    setCharges([
      { id: 'dining', label: 'In-Room Dining / Services', amount: 65 },
      { id: 'laundry', label: 'Laundry & Dry Cleaning', amount: 0 },
      { id: 'spa', label: 'Spa & Wellness', amount: 0 },
      { id: 'minibar', label: 'Mini-Bar Restock', amount: 0 },
      { id: 'taxi', label: 'Airport / Transport', amount: 0 },
    ]);
    setActiveModal('checkout');
  };

  const sendEmailInvoice = () => {
    addToast(`Invoice #${lastInvoice?.invoiceNo} emailed to guest successfully.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Room #"
              value={searchNum}
              onChange={(e) => setSearchNum(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none w-20"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Executive Suite">Executive Suite</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Needs Cleaning">Needs Cleaning</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <button
          onClick={() => setActiveModal('res')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Reservation
        </button>
      </div>

      {/* Interactive Room Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredRooms.map((room) => {
          const effectivePrice = getEffectiveRoomPrice(room);
          const amenities = ROOM_AMENITIES[room.type] || [];
          return (
            <div
              key={room.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono text-slate-100">{room.number}</span>
                  <p className="text-xs text-slate-400">{room.floor}</p>
                </div>
                <Badge variant={room.status}>{room.status}</Badge>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <div>
                  <p className="font-semibold">{room.type}</p>
                  <p className="text-slate-400 mt-0.5">
                    ${effectivePrice} / night
                    {sysConfig.basePriceOverride ? (
                      <span className="text-indigo-400 ml-1 font-semibold">(+${sysConfig.basePriceOverride})</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {amenities.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-400 text-[10px] border border-slate-700/60">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                {room.status === 'Available' && (
                  <button
                    onClick={() => { setSelectedRoom(room); setActiveModal('checkin'); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" /> Check-In
                  </button>
                )}
                {room.status === 'Occupied' && (
                  <button
                    onClick={() => openCheckOut(room)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Express Billing
                  </button>
                )}
                {(room.status === 'Needs Cleaning' || room.status === 'Maintenance') && (
                  <button
                    onClick={() => updateRoomStatus(room.number, 'Available')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Override to Available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: New Reservation */}
      {activeModal === 'res' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Create New Reservation</h3>
            <form onSubmit={handleCreateReservation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={resForm.guestName}
                  onChange={(e) => setResForm({ ...resForm, guestName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={resForm.checkIn}
                    onChange={(e) => setResForm({ ...resForm, checkIn: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={resForm.checkOut}
                    onChange={(e) => setResForm({ ...resForm, checkOut: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Number of Nights</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={resForm.nights}
                    onChange={(e) => setResForm({ ...resForm, nights: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                  <select
                    value={resForm.payment}
                    onChange={(e) => setResForm({ ...resForm, payment: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Loyalty Points</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign Available Room</label>
                <select
                  value={resForm.roomNum}
                  onChange={(e) => setResForm({ ...resForm, roomNum: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                >
                  {rooms.filter(r => r.status === 'Available').map(r => (
                    <option key={r.id} value={r.number}>Room {r.number} ({r.type} - ${getEffectiveRoomPrice(r)})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">Book Stay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Booking Confirmation */}
      {activeModal === 'confirm' && confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 max-w-md w-full rounded-xl p-6 space-y-5 shadow-2xl shadow-emerald-900/20">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="p-3 rounded-full bg-emerald-500/15">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Reservation Confirmed</h3>
                <p className="text-xs text-slate-400">Confirmation #{confirmedBooking.confirmation}</p>
              </div>
            </div>
            <div className="space-y-3 text-xs bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
              <div className="flex justify-between"><span className="text-slate-400">Guest Name</span><span className="font-semibold text-slate-100">{confirmedBooking.guest}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Room</span><span className="font-semibold text-slate-100">#{confirmedBooking.room?.number} · {confirmedBooking.room?.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Check-In</span><span className="font-semibold text-slate-100">{confirmedBooking.checkIn || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Check-Out</span><span className="font-semibold text-slate-100">{confirmedBooking.checkOut || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Nights</span><span className="font-semibold text-slate-100">{confirmedBooking.nights}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className="font-semibold text-slate-100">{confirmedBooking.payment}</span></div>
              <div className="pt-2 border-t border-slate-700/60 flex justify-between"><span className="font-bold text-slate-200">Total Due</span><span className="font-bold text-emerald-400">${confirmedBooking.total}</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700">Print Voucher</button>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Guest Check-In */}
      {activeModal === 'checkin' && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Check-In to Room {selectedRoom.number}</h3>
            <form onSubmit={handleCheckInSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Keycard RFID Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="Scan or enter RFID card ID..."
                  value={keyCardId}
                  onChange={(e) => setKeyCardId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="idCheck" required className="w-4 h-4 accent-indigo-600 rounded" />
                <label htmlFor="idCheck" className="text-slate-300">Verified Guest Passport / National Photo ID</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">Confirm Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Express Checkout with Editable Charges */}
      {activeModal === 'checkout' && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-xl p-6 space-y-5 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Express Billing & Check-Out</h3>
                <p className="text-slate-400">Room #{selectedRoom.number} • {selectedRoom.type}</p>
              </div>
              <button onClick={() => window.print()} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg">
                <Printer className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Stay Duration (Nights)</label>
              <input
                type="number"
                min={1}
                value={nights}
                onChange={(e) => setNights(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-200">Itemized Charges</p>
                <button onClick={addCharge} className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold">
                  <Plus className="w-3 h-3" /> Add Line
                </button>
              </div>
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between text-slate-400 px-1 pb-1 border-b border-slate-700/40">
                  <span>Room Stay ({nights} x ${roomRate})</span>
                  <span className="text-slate-200 font-semibold">${roomTotal.toFixed(2)}</span>
                </div>
                {charges.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      value={c.label}
                      onChange={(e) => updateCharge(c.id, 'label', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={c.amount}
                      onChange={(e) => updateCharge(c.id, 'amount', e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-md p-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                    />
                    <button onClick={() => removeCharge(c.id)} className="p-1.5 rounded-md text-rose-400 hover:bg-rose-600/10" title="Remove">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-700/40 space-y-1.5 px-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax ({sysConfig.taxRate}%)</span>
                    <span>${taxAmt.toFixed(2)}</span>
                  </div>
                  <div className="pt-1 flex justify-between font-bold text-slate-100 text-sm">
                    <span>Grand Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Payment Received:</span>
              <button
                type="button"
                onClick={() => setIsPaid(!isPaid)}
                className={`px-3 py-1 rounded-full font-semibold ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
              >
                {isPaid ? 'Paid in Full' : 'Payment Pending'}
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Close</button>
              <button
                type="button"
                onClick={handleCheckOutSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg"
              >
                Complete Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Branded Invoice (PDF-Style) */}
      {activeModal === 'invoice' && lastInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 text-slate-900 max-w-lg w-full rounded-xl shadow-2xl my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-800 via-slate-900 to-slate-900 text-white p-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-6 h-6 text-indigo-300" />
                  <span className="font-black text-xl tracking-wider">LUXURYSTAY</span>
                </div>
                <p className="text-xs text-slate-300">100 Oceanfront Boulevard · Hospitality District</p>
                <p className="text-xs text-slate-400">Reservations@luxurystay.com · +1 (555) 000-1234</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg tracking-widest">INVOICE</p>
                <p className="text-xs text-slate-300">#{lastInvoice.invoiceNo}</p>
                <p className="text-xs text-slate-400 mt-1">Issued: {lastInvoice.issued}</p>
              </div>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Bill To</p>
                  <p className="font-bold text-sm text-slate-900 mt-1">{lastInvoice.guest}</p>
                  <p className="text-slate-600">Room #{lastInvoice.room?.number}</p>
                  <p className="text-slate-600">{lastInvoice.room?.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Stay Details</p>
                  <p className="font-semibold text-slate-900 mt-1">{lastInvoice.nights} Nights</p>
                  <Badge variant="Paid">{isPaid ? 'Paid' : 'Outstanding'}</Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>
                <div className="grid grid-cols-12 gap-2 py-1.5 text-slate-700 border-b border-slate-100">
                  <span className="col-span-6 font-medium">Room Accommodation</span>
                  <span className="col-span-2 text-right">{lastInvoice.nights}</span>
                  <span className="col-span-2 text-right">${roomRate.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-semibold">${lastInvoice.roomTotal.toFixed(2)}</span>
                </div>
                {lastInvoice.charges.filter(c => Number(c.amount) > 0).map((c) => (
                  <div key={c.id} className="grid grid-cols-12 gap-2 py-1.5 text-slate-700 border-b border-slate-100">
                    <span className="col-span-6 font-medium">{c.label}</span>
                    <span className="col-span-2 text-right">1</span>
                    <span className="col-span-2 text-right">—</span>
                    <span className="col-span-2 text-right font-semibold">${Number(c.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 ml-auto max-w-[200px] pt-2">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${lastInvoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax ({sysConfig.taxRate}%)</span><span>${lastInvoice.taxAmt.toFixed(2)}</span></div>
                <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-slate-900 text-sm"><span>Total Due</span><span>${lastInvoice.grandTotal.toFixed(2)}</span></div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-4 text-center">
                <p className="text-[11px] text-slate-500 italic">"Thank you for choosing LuxuryStay. We look forward to your next visit."</p>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button onClick={sendEmailInvoice} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500">
                <Mail className="w-4 h-4" /> Email Invoice
              </button>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};