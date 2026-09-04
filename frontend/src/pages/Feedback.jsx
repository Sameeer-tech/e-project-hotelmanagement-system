import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import {
  MessageSquareHeart,
  Star,
  Send,
  Search,
  Filter,
  Loader2,
  User,
} from 'lucide-react';

// Feedback page:
//  - Guests see a "submit feedback" form (rating + comment).
//  - Staff (admin/manager/reception) see all submitted feedback in a table,
//    with filtering by rating / search.
export const Feedback = () => {
  const { user, hasRole } = useAuth();
  const { addToast, submitFeedback } = useApp();
  const isStaff = hasRole([ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING]);

  // Submission form state (guest)
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('Overall');
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  // Admin view state
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState('All');
  const [feedbackList, setFeedbackList] = useState([]);

  // Seed initial list with some mock entries so admin view isn't empty
  useEffect(() => {
    const seed = [
      { _id: 'f1', guest: 'Jonathan Pierce', email: 'j.pierce@email.com', rating: 5, category: 'Overall', comment: 'Outstanding service! The concierge went above and beyond.', date: '2026-09-02', replied: true },
      { _id: 'f2', guest: 'Aisha Rahman', email: 'a.rahman@email.com', rating: 4, category: 'Cleanliness', comment: 'Very clean room. Bathroom fixtures could use updating.', date: '2026-09-01', replied: false },
      { _id: 'f3', guest: 'Marco Rossi', email: 'm.rossi@email.com', rating: 5, category: 'Dining', comment: 'Breakfast buffet selection was excellent!', date: '2026-08-31', replied: true },
      { _id: 'f4', guest: 'Priya Patel', email: 'p.patel@email.com', rating: 3, category: 'Check-in', comment: 'Waited 20 minutes at reception despite having a reservation.', date: '2026-08-30', replied: false },
      { _id: 'f5', guest: 'Daniel Kim', email: 'd.kim@email.com', rating: 4, category: 'Facilities', comment: 'Gym equipment is top-notch. Pool area was clean.', date: '2026-08-29', replied: false },
    ];
    setFeedbackList(seed);
  }, []);

  // Fetch from backend when it exists
  useEffect(() => {
    if (!isStaff) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await api.get('/feedback').catch(() => null);
        if (res?.data?.length) setFeedbackList(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      addToast('Please share a few words in the comment box.', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        rating,
        comment: comment.trim(),
        category,
        guestName: user?.name || 'Guest',
        email: user?.email || '',
      };
      await api.post('/feedback', payload).catch(() => {});
      submitFeedback(rating, comment);
      // Add to local list for admin view
      setFeedbackList((prev) => [
        {
          _id: `f-${Date.now()}`,
          guest: user?.name || 'Guest',
          email: user?.email || '',
          rating,
          category,
          comment: comment.trim(),
          date: new Date().toISOString().slice(0, 10),
          replied: false,
        },
        ...prev,
      ]);
      setSubmitDone(true);
      addToast(`Thank you! Rated ${rating}/5 stars.`, 'success');
      setComment('');
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin list filter
  const filteredList = feedbackList.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      f.guest.toLowerCase().includes(q) ||
      f.comment.toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q);
    const matchesRating = minRating === 'All' || f.rating === Number(minRating);
    return matchesSearch && matchesRating;
  });

  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
      : '0.0';

  const Stars = ({ value, size = 'w-4 h-4', interactive = false, onChange, onHover }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = interactive ? (onHover || value) >= n : value >= n;
        return (
          <button
            key={n}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(n)}
            onMouseEnter={() => interactive && onHover && onHover(n)}
            onMouseLeave={() => interactive && onHover && onHover(0)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} transition-transform ${
              interactive ? 'hover:scale-110' : ''
            }`}
          >
            <Star
              className={`${size} ${
                active
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600 fill-slate-800'
              }`}
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <MessageSquareHeart className="w-6 h-6 text-indigo-400" /> Feedback
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {isStaff
            ? 'Review all guest feedback and ratings.'
            : 'Tell us about your stay — we read every comment.'}
        </p>
      </div>

      {/* Guest submission form (always visible for guests; staff can also demo submit) */}
      {(!isStaff || true) && (
        <div className="bg-gradient-to-br from-indigo-900/20 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          {submitDone && !isStaff && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 flex-shrink-0" />
              Thanks for your feedback! A member of our team will review it shortly.
            </div>
          )}

          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-slate-100">How was your stay?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your feedback helps us improve LuxuryStay for every guest.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-amber-400">{avgRating}</div>
              <div>
                <Stars value={Math.round(avgRating)} size="w-4 h-4" />
                <p className="text-[11px] text-slate-500 mt-1">
                  Based on {feedbackList.length} reviews
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="space-y-2">
              <label className="block text-slate-400 font-medium">Your Rating</label>
              <div className="flex items-center gap-4">
                <Stars
                  value={rating}
                  size="w-7 h-7"
                  interactive
                  onChange={setRating}
                  onHover={setHoverRating}
                />
                <span className="text-xs text-slate-400 font-medium">
                  {rating} / 5 stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full md:w-64 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option>Overall</option>
                <option>Cleanliness</option>
                <option>Staff / Service</option>
                <option>Room / Facilities</option>
                <option>Dining / F&B</option>
                <option>Check-in / Check-out</option>
                <option>Value for Money</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Share your experience *
              </label>
              <textarea
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love? What could we do better?..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setComment('');
                  setRating(5);
                }}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin/staff: feedback table */}
      {isStaff && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">All Guest Feedback</h2>
              <p className="text-xs text-slate-400 mt-1">
                {feedbackList.length} total • Avg {avgRating}/5 ★
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none pr-2"
                >
                  <option value="All" className="bg-slate-900">All Ratings</option>
                  <option value="5" className="bg-slate-900">5 ★ only</option>
                  <option value="4" className="bg-slate-900">4 ★ only</option>
                  <option value="3" className="bg-slate-900">3 ★ only</option>
                  <option value="2" className="bg-slate-900">2 ★ only</option>
                  <option value="1" className="bg-slate-900">1 ★ only</option>
                </select>
              </div>
              <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search guest / comment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none w-40 sm:w-56"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="ml-3 text-sm text-slate-400">Loading feedback...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/50 uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Comment</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredList.length > 0 ? (
                    filteredList.map((f) => (
                      <tr key={f._id} className="hover:bg-slate-800/30 align-top">
                        <td className="p-4 font-mono text-slate-400 whitespace-nowrap">{f.date}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-[11px] font-bold border border-indigo-500/30 flex-shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-100">{f.guest}</p>
                              <p className="text-[10px] text-slate-500">{f.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px]">
                            {f.category}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <Stars value={f.rating} size="w-3.5 h-3.5" />
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="text-slate-300 leading-relaxed">{f.comment}</p>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <Badge variant={f.replied ? 'Active' : 'Inactive'}>
                            {f.replied ? 'Replied' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        No feedback matches your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
