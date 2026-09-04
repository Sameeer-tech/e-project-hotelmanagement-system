import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Mail, Lock, UserCheck, Eye, EyeOff } from 'lucide-react';

// Login page — the entry point for every user. Shows role tabs, email/password,
// a "remember me" checkbox, and a link to register for new users.
export const Login = () => {
  const { login } = useAuth();
  const { addToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // If the user was redirected here from a protected route, take them back after login.
  const from = location.state?.from?.pathname || null;

  const [role, setRole] = useState('receptionist');
  const [email, setEmail] = useState('demo@luxurystay.com');
  const [password, setPassword] = useState('password');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ROLE_TABS = [
    { key: 'admin', label: 'Admin', icon: ShieldAlert },
    { key: 'manager', label: 'Manager', icon: ShieldAlert },
    { key: 'receptionist', label: 'Receptionist', icon: UserCheck },
    { key: 'housekeeping', label: 'Housekeeping', icon: UserCheck },
    { key: 'guest', label: 'Guest', icon: UserCheck },
  ];

  // Default home route per role — used after a successful login.
  const homeByRole = {
    admin: '/admin',
    manager: '/admin',
    receptionist: '/checkinout',
    housekeeping: '/housekeeping',
    guest: '/guest-profile',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password, role);
      if (res.success) {
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        navigate(from || homeByRole[role], { replace: true });
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // One-click demo login — fills in fields and submits.
  const quickLogin = async (quickRole) => {
    setRole(quickRole);
    setLoading(true);
    try {
      const res = await login(`demo-${quickRole}@luxurystay.com`, 'password', quickRole);
      if (res.success) {
        addToast(`Signed in as ${quickRole.toUpperCase()} (demo mode)`, 'info');
        navigate(from || homeByRole[quickRole], { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 mb-3">
            <ShieldAlert className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">LUXURYSTAY</h1>
          <p className="text-sm text-slate-400 mt-1">Hospitality Management System</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Role tabs */}
          <div className="grid grid-cols-5 border-b border-slate-800">
            {ROLE_TABS.map((t) => {
              const Icon = t.icon;
              const active = role === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setRole(t.key)}
                  className={`px-2 py-3 text-[11px] font-semibold flex flex-col items-center gap-1 transition-colors ${
                    active
                      ? 'text-indigo-300 bg-indigo-500/10 border-b-2 border-indigo-500'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-100">
              Sign in as <span className="capitalize text-indigo-300">{role}</span>
            </h2>

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
                  placeholder="you@luxurystay.com"
                />
              </div>
            </div>

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
                  placeholder="••••••••"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Create one
              </Link>
            </p>
          </form>

          {/* Quick demo login row */}
          <div className="px-6 pb-6 space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Demo mode — quick login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['admin', 'receptionist', 'guest'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => quickLogin(r)}
                  disabled={loading}
                  className="py-2 text-[11px] font-semibold capitalize rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
