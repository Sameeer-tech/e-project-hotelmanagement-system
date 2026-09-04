import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

// ProtectedRoute wraps a page and ensures:
// 1) A user is logged in (JWT present), otherwise redirects to /login.
// 2) The user has one of the allowed roles (if allowedRoles is provided).
// Usage: <Route element={<ProtectedRoute allowedRoles={['admin','manager']} />}>
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, authLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // While we check localStorage on mount, show a simple spinner.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, remembering where the user was trying to go.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If specific roles are required, enforce them.
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Send to role-appropriate landing page instead of a dead 403.
      const homeByRole = {
        admin: '/admin',
        manager: '/admin',
        receptionist: '/checkinout',
        housekeeping: '/housekeeping',
        guest: '/guest-profile',
      };
      return <Navigate to={homeByRole[user.role] || '/login'} replace />;
    }
  }

  return children;
};
