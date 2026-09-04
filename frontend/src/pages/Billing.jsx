import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import {
  Receipt,
  User,
  Phone,
  Mail,
  CalendarDays,
  Printer,
  FileText,
  Coffee,
  Car,
  BedDouble,
  DollarSign,
  Search,
  Loader2,
} from 'lucide-react';

// Billing & Invoice page — shows a bill breakdown (room charge + extra services)
// and has a "Generate Invoice" button that prints the HTML invoice view.
export const Billing = () => {
  const { rooms, sysConfig, getEffectiveRoomPrice, addToast } = useApp();

  const [loading, setLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState('BK-2026-1001');
  const [showInvoice, setShowInvoice] = useState(false);

  // Demo: pick an occupied room to build a sample bill.
  const occupiedRoom = rooms.find((r) => r.status === 'Occupied') || rooms[0];

  // Guest info (demo — in real app this comes from /api/billing/:bookingId)
  const [guest, setGuest] = useState({
    name: 'Jonathan Pierce',
    email: 'j.pierce@email.com',
    phone: '+1 555 018 2209',
  });

  const [dates, setDates] = useState({
    checkIn: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    checkOut: new Date().toISOString().slice(0, 10),
  });

  // Editable line items: each extra service can be toggled on/off
  const [extras, setExtras] = useState([
    { id: 'e1', name: 'Breakfast (daily)', qty: 2, price: 25, enabled: true, icon: Coffee },
    { id: 'e2', name: 'Airport Transfer', qty: 1, price: 60, enabled: false, icon: Car },
    { id: 'e3', name: 'Room Service Dinner', qty: 1, price: 85, enabled: true, icon: BedDouble },
    { id: 'e4', name: 'Spa Treatment', qty: 1, price: 150, enabled: false, icon: Receipt },
    { id: 'e5', name: 'Late Check-out Fee', qty: 1, price: 45, enabled: false, icon: CalendarDays },
  ]);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        await api.get(`/billing/${bookingRef}`).catch(() => {});
      } finally {
        setLoading(false);
      }
    };
    if (bookingRef) fetchBill();
  }, [bookingRef]);

  const nights = useMemo(() => {
    const ms = new Date(dates.checkOut) - new Date(dates.checkIn);
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [dates]);

  const roomRate = occupiedRoom ? getEffectiveRoomPrice(occupiedRoom) : 0;
  const roomTotal = roomRate * nights;
  const extrasTotal = extras
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.qty * e.price, 0);
  const subtotal = roomTotal + extrasTotal;
  const taxRate = (sysConfig?.taxRate || 12) / 100;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const grandTotal = subtotal + tax;

  const toggleExtra = (id) =>
    setExtras((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );

  const updateExtra = (id, field, value) =>
    setExtras((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: Number(value) || value } : e))
    );

  const handleGenerateInvoice = () => {
    setShowInvoice(true);
    addToast('Invoice generated. Use Print to save as PDF.', 'success');
    // Delay-print to allow the invoice view to render first.
    setTimeout(() => {
      if (window.confirm('Print / Save invoice as PDF now?')) {
        window.print();
      }
    }, 400);
  };

  // ---- INVOICE VIEW (printable) ----
  if (showInvoice) {
    return (
      <div className="max-w-3xl mx-auto bg-white text-slate-900 shadow-xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-10 py-8 print:bg-indigo-700">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-wide">LUXURYSTAY</h1>
              <p className="text-indigo-200 text-sm mt-1">Hospitality Group • Invoice</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-lg">Invoice #INV-{bookingRef}</p>
              <p className="text-indigo-200">
                Issued: {new Date().toLocaleDateString()}
              </p>
              <Badge variant="Active">PAID</Badge>
            </div>
          </div>
        </div>

        {/* Guest + stay info */}
        <div className="px-10 py-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Bill To
            </h3>
            <p className="font-bold text-lg text-slate-900">{guest.name}</p>
            <p className="flex items-center gap-1.5 text-slate-600 mt-1">
              <Mail className="w-3.5 h-3.5" /> {guest.email}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5" /> {guest.phone}
            </p>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Stay Details
            </h3>
            <p>
              <span className="text-slate-500">Room:</span>{' '}
              <span className="font-bold text-slate-900">
                #{occupiedRoom?.number} — {occupiedRoom?.type}
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-600 mt-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {dates.checkIn} → {dates.checkOut} ({nights} night{nights > 1 ? 's' : ''})
            </p>
            <p className="text-slate-600">Booking Ref: {bookingRef}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="px-10 pb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="text-left py-3">Description</th>
                <th className="text-center py-3">Qty</th>
                <th className="text-right py-3">Unit</th>
                <th className="text-right py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              <tr className="border-b border-slate-100">
                <td className="py-3 font-medium">
                  Room #{occupiedRoom?.number} ({occupiedRoom?.type})
                  <p className="text-[11px] text-slate-500">
                    ${roomRate.toLocaleString()} × {nights} nights
                  </p>
                </td>
                <td className="text-center py-3">{nights}</td>
                <td className="text-right py-3">${roomRate.toLocaleString()}</td>
                <td className="text-right py-3 font-semibold">
                  ${roomTotal.toLocaleString()}
                </td>
              </tr>
              {extras
                .filter((e) => e.enabled)
                .map((e) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium">{e.name}</td>
                    <td className="text-center py-3">{e.qty}</td>
                    <td className="text-right py-3">${e.price}</td>
                    <td className="text-right py-3 font-semibold">
                      ${(e.qty * e.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span>${tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-200 pt-3 mt-3">
              <span>Total</span>
              <span className="text-emerald-600">${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between print:bg-white">
          <p>Thank you for choosing LuxuryStay. We look forward to your next visit.</p>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => setShowInvoice(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
            >
              ← Back
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN BILLING VIEW ----
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Billing & Invoice</h1>
          <p className="text-sm text-slate-400 mt-1">
            Build a bill, add extra services, and generate a printable invoice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateInvoice}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Booking ref lookup */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <label className="text-xs text-slate-400 font-medium">Lookup by Booking Reference</label>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-indigo-500">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-200 focus:outline-none"
              placeholder="BK-XXXX-XXXX"
            />
          </div>
          <button
            onClick={() => addToast('Bill refreshed from (mocked) backend.', 'info')}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bill breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            Bill Breakdown — {bookingRef}
          </h2>

          {/* Guest card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-4 bg-slate-800/40 border border-slate-800 rounded-lg">
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Guest</p>
              <p className="text-sm font-semibold text-slate-100 mt-0.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> {guest.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Contact</p>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {guest.email}
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {guest.phone}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Stay</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Room #{occupiedRoom?.number} • {occupiedRoom?.type}
              </p>
              <p className="text-xs text-slate-300">
                {dates.checkIn} → {dates.checkOut} ({nights}n)
              </p>
            </div>
          </div>

          {/* Room charge row */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Accommodation
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Room #{occupiedRoom?.number} — {occupiedRoom?.type}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ${roomRate.toLocaleString()}/night × {nights} nights
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-100">
                ${roomTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Extras list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Extra Services
              </h3>
              <span className="text-[11px] text-slate-500">
                {extras.filter((e) => e.enabled).length} item
                {extras.filter((e) => e.enabled).length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="space-y-2">
              {extras.map((e) => {
                const Icon = e.icon;
                return (
                  <div
                    key={e.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      e.enabled
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-slate-800/10 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={e.enabled}
                        onChange={() => toggleExtra(e.id)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-100">{e.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            Qty
                            <input
                              type="number"
                              min={1}
                              value={e.qty}
                              onChange={(ev) => updateExtra(e.id, 'qty', ev.target.value)}
                              className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </label>
                          <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            $
                            <input
                              type="number"
                              min={0}
                              value={e.price}
                              onChange={(ev) => updateExtra(e.id, 'price', ev.target.value)}
                              className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </label>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-100 text-right">
                        ${(e.qty * e.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Totals sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit sticky top-20 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Totals
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Room Charges</span>
              <span className="text-slate-200 font-medium">
                ${roomTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Extra Services</span>
              <span className="text-slate-200 font-medium">
                ${extrasTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-300 font-medium">Subtotal</span>
              <span className="text-slate-100 font-semibold">
                ${subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                Tax ({(taxRate * 100).toFixed(1)}%)
              </span>
              <span className="text-slate-200 font-medium">${tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-slate-700">
              <span className="text-slate-100 font-bold text-base">Grand Total</span>
              <span className="text-emerald-400 font-bold text-xl">
                ${grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleGenerateInvoice}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Generate Invoice
            </button>
            <button
              onClick={() => addToast('Payment processed (demo mode).', 'success')}
              className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-sm font-semibold rounded-lg transition-colors"
            >
              Mark as Paid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
