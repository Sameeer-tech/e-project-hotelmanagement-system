import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Wifi, Tv, Coffee, Utensils, Star, QrCode, Phone, Plane, BedDouble, Clock, User, Mail, MapPin, Award, FileText, Heart, Sparkles, Car } from 'lucide-react';

const ROOM_AMENITIES_ICONS = {
  Standard: { icons: [Wifi, Tv, Coffee], labels: ['WiFi', 'HD TV', 'Coffee'] },
  Deluxe: { icons: [Wifi, Tv, Coffee, Utensils, Sparkles], labels: ['WiFi', 'HD TV', 'Coffee', 'Dining', 'Balcony'] },
  'Executive Suite': { icons: [Wifi, Tv, Coffee, Utensils, Sparkles, Award], labels: ['WiFi', '4K TV', 'Espresso', 'Dining', 'Tub', 'Concierge'] },
};

export const GuestPortal = () => {
  const { rooms, addToast, guests, updateGuestProfile, getEffectiveRoomPrice, sysConfig, submitFeedback, feedbackScores } = useApp();
  const guest = guests?.[0];

  // Booking Filter State
  const [selectedType, setSelectedType] = useState('All');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    nationality: guest?.nationality || '',
    preferences: (guest?.preferences || []).join(', '),
    specialRequests: (guest?.specialRequests || []).join(', '),
  });

  // Wake-up call & airport state
  const [wakeTime, setWakeTime] = useState('');
  const [pickupDateTime, setPickupDateTime] = useState('');

  // Feedback Form State
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const avgScore = useMemo(() => {
    if (!feedbackScores?.length) return 0;
    return feedbackScores.reduce((s, n) => s + n, 0) / feedbackScores.length;
  }, [feedbackScores]);

  const handleServiceOrder = (item) => {
    addToast(`Ordered: ${item}. Room service has been dispatched to your suite.`, 'success');
    setIsServiceModalOpen(false);
  };

  const handleScheduleWakeUp = () => {
    if (!wakeTime) return;
    addToast(`Wake-up call scheduled at ${wakeTime}. An operator will call Suite 302.`, 'success');
    setWakeTime('');
  };

  const handleScheduleTransfer = () => {
    if (!pickupDateTime) return;
    addToast(`Airport transfer confirmed for ${pickupDateTime}. Driver details sent to reception.`, 'success');
    setPickupDateTime('');
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    submitFeedback(rating, feedbackText);
    setFeedbackText('');
    setRating(5);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateGuestProfile(guest.id, {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      nationality: profileForm.nationality,
      preferences: profileForm.preferences.split(',').map((s) => s.trim()).filter(Boolean),
      specialRequests: profileForm.specialRequests.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setIsProfileModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Active Guest Reservation Summary + Loyalty Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Active Stay</span>
            <h2 className="text-xl font-bold text-slate-100">Suite 302 — Executive Ocean View</h2>
            <p className="text-xs text-slate-400">Confirmation #LX-99420 • Check-Out: Sept 04, 2026</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setIsServiceModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Request Room Service
              </button>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
              >
                <User className="w-3.5 h-3.5 inline mr-1" /> My Profile
              </button>
            </div>
          </div>

          {/* Digital Key QR Code */}
          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-lg border border-slate-800">
            <div className="p-2 bg-white rounded-md">
              <QrCode className="w-12 h-12 text-slate-950" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-200">Digital Room Key</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Hold near door lock sensor</p>
            </div>
          </div>
        </div>

        {/* Loyalty Status Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-purple-900/30 border border-indigo-500/30 p-6 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-slate-100">{guest?.name || 'Guest'}</span>
            </div>
            <Badge variant={guest?.loyaltyTier || 'Silver'}>{guest?.loyaltyTier || 'Silver'}</Badge>
          </div>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-400">Loyalty Points</span><span className="font-bold text-slate-100">{(guest?.points || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Avg Guest Rating</span><span className="font-bold text-amber-400">{avgScore.toFixed(1)} ★</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Stay History</span><span className="font-bold text-slate-100">{guest?.stayHistory?.length || 0} stays</span></div>
          </div>
          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-[11px] text-slate-500 mb-1.5">Next Tier Progress</p>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(100, ((guest?.points || 0) / 50000) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 text-right">{50000 - (guest?.points || 0)} points to Diamond</p>
          </div>
        </div>
      </div>

      {/* On-Demand Concierge Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /><p className="text-xs font-bold text-slate-100">Wake-Up Call</p></div>
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-slate-200 focus:outline-none" />
          <button onClick={handleScheduleWakeUp} className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-md text-xs font-semibold border border-amber-500/30">Schedule</button>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2"><Car className="w-4 h-4 text-indigo-400" /><p className="text-xs font-bold text-slate-100">Airport Transfer</p></div>
          <input type="datetime-local" value={pickupDateTime} onChange={(e) => setPickupDateTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-slate-200 focus:outline-none" />
          <button onClick={handleScheduleTransfer} className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-md text-xs font-semibold border border-indigo-500/30">Book Ride</button>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-400" /><p className="text-xs font-bold text-slate-100">Housekeeping</p></div>
          <p className="text-[11px] text-slate-400">Request immediate turndown or linen refresh.</p>
          <button onClick={() => handleServiceOrder('Turndown Service')} className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md text-xs font-semibold border border-emerald-500/30">Request Now</button>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /><p className="text-xs font-bold text-slate-100">Special Occasion</p></div>
          <p className="text-[11px] text-slate-400">Birthdays, anniversaries & surprise setups.</p>
          <button onClick={() => handleServiceOrder('Special Occasion Concierge')} className="w-full py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-md text-xs font-semibold border border-rose-500/30">Notify Concierge</button>
        </div>
      </div>

      {/* Room Catalog + Amenities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Explore & Reserve Rooms</h2>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Executive Suite">Executive Suite</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms
            .filter((r) => selectedType === 'All' || r.type === selectedType)
            .map((room) => {
              const amen = ROOM_AMENITIES_ICONS[room.type] || { icons: [], labels: [] };
              const ep = getEffectiveRoomPrice(room);
              return (
                <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="h-32 bg-gradient-to-br from-slate-800 via-indigo-900/20 to-slate-900 flex items-center justify-center text-slate-500 font-mono text-xs border-b border-slate-800">
                    <BedDouble className="w-8 h-8 opacity-40 mr-2" />
                    <span>[ {room.type} · Room {room.number} ]</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-100">{room.type}</h3>
                      <div className="text-right">
                        <span className="text-sm font-bold text-indigo-400">${ep}/night</span>
                        {sysConfig.basePriceOverride ? (
                          <p className="text-[10px] text-indigo-400/80">incl. surcharge</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      {amen.icons.slice(0, 5).map((Icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5" title={amen.labels[i]}>
                          <Icon className="w-4 h-4" />
                          <span className="text-[9px] text-slate-500">{amen.labels[i]}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addToast(`Booking request for Room ${room.number} sent to Front Desk.`, 'info')}
                      className="w-full py-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                    >
                      Reserve Room
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Guest Stay History Table (B2) */}
      {guest?.stayHistory?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">Your Stay History</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Past stays, invoices & ratings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead className="bg-slate-800/50 uppercase text-slate-400">
                <tr>
                  <th className="p-4">Stay Dates</th>
                  <th className="p-4">Room</th>
                  <th className="p-4">Total Paid</th>
                  <th className="p-4">Your Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {guest.stayHistory.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-100">{s.dates}</td>
                    <td className="p-4">#{s.room}</td>
                    <td className="p-4">{s.total}</td>
                    <td className="p-4"><span className="text-amber-400">{'★'.repeat(s.rating)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedback Widget Component */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 max-w-xl">
        <h2 className="text-base font-bold text-slate-100">Guest Experience Feedback</h2>
        <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 ${star <= rating ? 'text-amber-400' : 'text-slate-600'}`}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            required
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none"
            placeholder="Tell us about your stay experience..."
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">
            Submit Review
          </button>
        </form>
      </div>

      {/* On-Demand Service Modal (Expanded: B2 + C3) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-100">In-Room On-Demand Services</h3>
            <div className="space-y-2">
              {[
                { title: 'Gourmet Breakfast Tray', price: '$28', icon: Utensils },
                { title: 'Express Evening Laundry', price: '$15', icon: Sparkles },
                { title: 'Airport Shuttle Taxi', price: '$45', icon: Car },
                { title: 'Wake-Up Call Service', price: 'Complimentary', icon: Clock },
                { title: 'Late Check-Out Request', price: 'Subject to avail.', icon: BedDouble },
                { title: 'Private City Transfer', price: '$85', icon: Plane },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600/15 text-indigo-400 rounded-md border border-indigo-500/30">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{item.title}</p>
                        <p className="text-slate-400">{item.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleServiceOrder(item.title)}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg"
                    >
                      Order
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Profile Edit Modal (B2 - Profiles + Preferences + Special Requests) */}
      {isProfileModalOpen && guest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-xl p-6 space-y-5 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-indigo-600/15 text-indigo-400 border border-indigo-500/30">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Guest Profile</h3>
                  <p className="text-slate-400 text-[11px]">ID: {guest.id} • Passport: {guest.passport}</p>
                </div>
              </div>
              <Badge variant={guest.loyaltyTier}>{guest.loyaltyTier} • {guest.points} pts</Badge>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1"><User className="w-3 h-3 inline mr-1" />Full Name</label>
                  <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1"><Mail className="w-3 h-3 inline mr-1" />Email</label>
                  <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1"><Phone className="w-3 h-3 inline mr-1" />Phone</label>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1"><MapPin className="w-3 h-3 inline mr-1" />Nationality</label>
                  <input value={profileForm.nationality} onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1"><Heart className="w-3 h-3 inline mr-1" />Stay Preferences (comma-separated)</label>
                <input value={profileForm.preferences} onChange={(e) => setProfileForm({ ...profileForm, preferences: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500" placeholder="King Bed, Non-Smoking, High Floor" />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1"><Sparkles className="w-3 h-3 inline mr-1" />Special Requests (comma-separated)</label>
                <input value={profileForm.specialRequests} onChange={(e) => setProfileForm({ ...profileForm, specialRequests: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500" placeholder="Hypoallergenic pillows, flowers on arrival" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};