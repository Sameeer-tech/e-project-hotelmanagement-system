import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, ROLES, ADMIN_ROLES, STAFF_ROLES } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ui/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffManagement } from './pages/StaffManagement';
import { RoomManagement } from './pages/RoomManagement';
import { Booking } from './pages/Booking';
import { CheckInOut } from './pages/CheckInOut';
import { Billing } from './pages/Billing';
import { Housekeeping } from './pages/Housekeeping';
import { Reports } from './pages/Reports';
import { Feedback } from './pages/Feedback';
import { AdditionalServices } from './pages/AdditionalServices';
import { GuestProfile } from './pages/GuestProfile';
import { SystemSettings } from './pages/SystemSettings';

import { ReceptionistPortal } from './pages/ReceptionistPortal';
import { HousekeepingPortal } from './pages/HousekeepingPortal';
import { GuestPortal } from './pages/GuestPortal';

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes: no auth required */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes wrapped in Layout (sidebar + header + outlet) */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect based on role */}
              <Route index element={<RoleBasedRedirect />} />

              {/* Admin / Manager only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <RoomManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                    <SystemSettings />
                  </ProtectedRoute>
                }
              />

              {/* Front Desk: Admin / Manager / Receptionist */}
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST]}>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkinout"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST]}>
                    <CheckInOut />
                  </ProtectedRoute>
                }
              />

              {/* Billing: Admin / Manager / Receptionist / Guest */}
              <Route
                path="/billing"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.GUEST]}>
                    <Billing />
                  </ProtectedRoute>
                }
              />

              {/* Housekeeping: Admin / Manager / Housekeeping staff */}
              <Route
                path="/housekeeping"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPING]}>
                    <Housekeeping />
                  </ProtectedRoute>
                }
              />

              {/* Guest profile: any authenticated user (guests view their own, staff view demo) */}
              <Route path="/guest-profile" element={<GuestProfile />} />

              {/* Additional Services: Guest + front desk can request */}
              <Route
                path="/services"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GUEST, ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST]}>
                    <AdditionalServices />
                  </ProtectedRoute>
                }
              />

              {/* Feedback: everyone */}
              <Route path="/feedback" element={<Feedback />} />

              {/* Legacy portal routes — kept for backward compatibility,
                  redirect to the proper dedicated pages. */}
              <Route
                path="/reception"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST]}>
                    <ReceptionistPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/housekeeping-portal"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPING]}>
                    <HousekeepingPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guest-portal"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GUEST, ROLES.ADMIN, ROLES.MANAGER]}>
                    <GuestPortal />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all: go to role-based home */}
              <Route path="*" element={<RoleBasedRedirect />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
}

function RoleBasedRedirect() {
  // Small helper that redirects "/" and unknown paths to the correct home page
  // for the logged-in user's role.
  // Note: We use a raw read from localStorage because this component renders
  // inside ProtectedRoute, but we want to keep the dependency footprint tiny.
  let role = null;
  try {
    const saved = localStorage.getItem('user');
    if (saved) role = JSON.parse(saved).role;
  } catch {}

  const homeByRole = {
    admin: '/admin',
    manager: '/admin',
    receptionist: '/checkinout',
    housekeeping: '/housekeeping',
    guest: '/guest-profile',
  };

  const target = homeByRole[role] || '/login';
  return <Navigate to={target} replace />;
}
