// src/components/layout/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Search, Bell, User } from 'lucide-react';

export const Header = ({ setMobileOpen, pageTitle }) => {
  const navigate = useNavigate();
  const { currentRole, setCurrentRole, sysConfig } = useApp();
  const { user, hasRole } = useAuth();

  // Maps each role to the route we land on when switching roles in demo mode.
  const ROLE_TO_ROUTE = {
    Admin: '/admin',
    Manager: '/admin',
    Receptionist: '/checkinout',
    Housekeeping: '/housekeeping',
    Guest: '/guest-profile',
  };

  // Option list for the role switcher. Admins can simulate any role for testing.
  // Non-admin users see only their own role.
  const availableRoles = hasRole(['admin', 'manager'])
    ? ['Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest']
    : [currentRole];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-100 hidden sm:block">{pageTitle}</h1>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center max-w-xs w-full bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/60 focus-within:border-indigo-500">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search bookings, guests, staff..."
          className="bg-transparent text-sm text-slate-200 focus:outline-none w-full placeholder-slate-500"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Role Selector Switcher (demo mode — admin can simulate any role) */}
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <User className="w-4 h-4 text-indigo-400 ml-1.5 hidden sm:inline" />
          <select
            value={currentRole}
            onChange={(e) => {
              const newRole = e.target.value;
              setCurrentRole(newRole);
              const targetRoute = ROLE_TO_ROUTE[newRole] || '/admin';
              navigate(targetRoute);
            }}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                Role: {r}
              </option>
            ))}
          </select>
        </div>

        {/* System Alert Notification Indicator */}
        <div className="relative cursor-pointer p-2 text-slate-400 hover:text-slate-200">
          <Bell className="w-5 h-5" />
          {sysConfig.emergencyAlert && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-slate-900" />
          )}
        </div>

        {/* Tiny user chip */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
