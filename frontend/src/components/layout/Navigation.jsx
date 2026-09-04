// src/components/layout/Navigation.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  CalendarCheck,
  LogIn,
  Receipt,
  Sparkles,
  BarChart3,
  MessageSquareHeart,
  UserCircle,
  Settings,
  ShieldAlert,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth, ROLES, ADMIN_ROLES } from '../../context/AuthContext';

// Full menu of all possible navigation items. The `allowedRoles` field
// controls which roles see the item. `undefined` = everyone sees it.
const ALL_NAV_ITEMS = [
  // Admin / Manager menu
  {
    name: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    allowedRoles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    name: 'Staff Management',
    path: '/staff',
    icon: Users,
    allowedRoles: ADMIN_ROLES,
  },
  {
    name: 'Room Management',
    path: '/rooms',
    icon: BedDouble,
    allowedRoles: ADMIN_ROLES,
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    allowedRoles: ADMIN_ROLES,
  },
  {
    name: 'System Settings',
    path: '/settings',
    icon: Settings,
    allowedRoles: ADMIN_ROLES,
  },

  // Receptionist menu (plus some shared)
  {
    name: 'Room Booking',
    path: '/booking',
    icon: CalendarCheck,
    allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  },
  {
    name: 'Check-in / Check-out',
    path: '/checkinout',
    icon: LogIn,
    allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  },
  {
    name: 'Billing & Invoice',
    path: '/billing',
    icon: Receipt,
    allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.GUEST],
  },

  // Housekeeping
  {
    name: 'Housekeeping',
    path: '/housekeeping',
    icon: Sparkles,
    allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPING],
  },

  // Feedback (admin views all, guests submit)
  {
    name: 'Feedback',
    path: '/feedback',
    icon: MessageSquareHeart,
    allowedRoles: undefined, // everyone
  },

  // Guest-only
  {
    name: 'Additional Services',
    path: '/services',
    icon: Sparkles,
    allowedRoles: [ROLES.GUEST, ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  },
  {
    name: 'My Profile',
    path: '/guest-profile',
    icon: UserCircle,
    allowedRoles: undefined, // everyone can view profile
  },
];

export const Navigation = ({ mobileOpen, setMobileOpen, userRole }) => {
  const { logout, user } = useAuth();

  // Filter menu to only show items the current role can see.
  const visibleItems = ALL_NAV_ITEMS.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(userRole)
  );

  // Group headings for a tidier sidebar
  const ADMIN_HEADING = ['Dashboard', 'Staff Management', 'Room Management', 'Reports', 'System Settings'];
  const FRONT_HEADING = ['Room Booking', 'Check-in / Check-out', 'Billing & Invoice'];
  const GUEST_HEADING = ['Additional Services', 'My Profile', 'Feedback'];

  const renderSection = (title, itemsInSection) => {
    const sectionItems = visibleItems.filter((i) => itemsInSection.includes(i.name));
    if (sectionItems.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="px-4 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          {title}
        </p>
        {sectionItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mx-1 my-0.5 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 transform 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-lg text-slate-100 tracking-wide">LUXURYSTAY</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {renderSection('Administration', ADMIN_HEADING)}
          {renderSection('Front Desk', FRONT_HEADING)}
          {renderSection('Operations', ['Housekeeping'])}
          {renderSection('Guest', GUEST_HEADING)}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-800">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'Guest'}</p>
            <p className="text-[11px] text-indigo-400 capitalize">{user?.role || 'guest'}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 border border-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
