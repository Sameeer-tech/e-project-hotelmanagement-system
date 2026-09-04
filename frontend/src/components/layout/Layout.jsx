import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { ToastContainer } from '../ui/ToastContainer';
import { useApp } from '../../context/AppContext';

// Main application shell: sidebar + header + main content area.
// Uses the role of the logged-in user to pick a sensible starting page
// and to let the sidebar filter its menu items.
export const Layout = () => {
  const { user, isAuthenticated } = useAuth();
  const { setCurrentRole } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Keep the legacy AppContext currentRole in sync so existing pages still work.
  React.useEffect(() => {
    if (user) {
      // Convert e.g. "admin" (from AuthContext) to "Admin" (expected by old AppContext code).
      const displayRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      setCurrentRole(displayRole);
    }
  }, [user, setCurrentRole]);

  // A short, user-facing title for the current portal based on role.
  const pageTitle = {
    admin: 'Admin Dashboard',
    manager: 'Manager Dashboard',
    receptionist: 'Front Desk Portal',
    housekeeping: 'Housekeeping Portal',
    guest: 'Guest Portal',
  }[user?.role] || 'LuxuryStay';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Sidebar Navigation (filtered by role) */}
      <Navigation
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        userRole={user?.role}
        onNavigate={(path) => {
          navigate(path);
          setMobileOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header setMobileOpen={setMobileOpen} pageTitle={pageTitle} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
