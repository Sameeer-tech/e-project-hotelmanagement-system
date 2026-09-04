import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ShieldAlert, UserPlus, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Registration page — supports both staff registration (if you're setting up the system)
// and guest self-registration. Guest is always the default for public sign-ups.
export const Register = () => {
  const { register } = useAuth();
  const { addToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState(ROLES.GUEST);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name.trim(), email.trim(), password, role);
      if (res.success) {
        addToast('Account created successfully! Welcome to LuxuryStay.', 'success');
        const homeByRole = {
          admin: '/admin',
          manager: '/admin',
          receptionist: '/checkinout',
          housekeeping: '/housekeeping',
          guest: '/guest-profile',
        };
        navigate(homeByRole[role], { replace: true });
      }
    } catch (err) {
      setError('Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 mb-3">
            <ShieldAlert className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">LUXURYSTAY</h1>
          <p className="text-sm text-slate-400 mt-1">Create your account</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Join LuxuryStay
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Already registered?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign in instead
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Full Name</label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-indigo-500">
                <User className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none"
                  placeholder="e.g. John Smith"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Email</label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-indigo-500">
                <Mail className="w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={ROLES.GUEST}>Guest</option>
                <option value={ROLES.RECEPTIONIST}>Staff — Receptionist</option>
                <option value={ROLES.HOUSEKEEPING}>Staff — Housekeeping</option>
                <option value={ROLES.MANAGER}>Staff — Manager</option>
                <option value={ROLES.ADMIN}>Staff — Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Password</label>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-indigo-500">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none"
                    placeholder="Min 6 chars"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Confirm</label>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-indigo-500">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none"
                    placeholder="Retype password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
