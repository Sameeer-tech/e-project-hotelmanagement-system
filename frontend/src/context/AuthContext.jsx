import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

// All possible system roles — used for selects and permission checks.
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  GUEST: 'guest',
};

// Role hierarchy: which roles can access admin-level features.
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.MANAGER];
export const STAFF_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING];

export const AuthProvider = ({ children }) => {
  // Keep the logged-in user object and JWT token in state.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Loading flag while we check localStorage on first mount.
  const [authLoading, setAuthLoading] = useState(true);

  // On app start, restore session from localStorage so a refresh doesn't log the user out.
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Corrupted user JSON: wipe everything and start fresh.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setAuthLoading(false);
  }, []);

  // Persist user + token to localStorage whenever they change.
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user, token]);

  // Login helper: call POST /api/auth/login, then store user + token.
  // Falls back to a mock login (no backend) so the UI can be demonstrated now.
  const login = async (email, password, role) => {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      // --- MOCK FALLBACK (remove when backend is ready) ---
      // Simulate a successful login with dummy user data.
      const mockUser = {
        _id: 'demo-user',
        name:
          role === ROLES.ADMIN ? 'Alex Admin'
          : role === ROLES.MANAGER ? 'Mia Manager'
          : role === ROLES.RECEPTIONIST ? 'Ryan Receptionist'
          : role === ROLES.HOUSEKEEPING ? 'Hannah Housekeeper'
          : 'Grace Guest',
        email,
        role,
      };
      const mockToken = `mock-token-${Date.now()}`;
      setToken(mockToken);
      setUser(mockUser);
      return { success: true, user: mockUser };
    }
  };

  // Register helper: POST /api/auth/register. Also has a mock fallback.
  const register = async (name, email, password, role) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      // --- MOCK FALLBACK ---
      const mockUser = {
        _id: `demo-${Date.now()}`,
        name,
        email,
        role,
      };
      const mockToken = `mock-token-${Date.now()}`;
      setToken(mockToken);
      setUser(mockUser);
      return { success: true, user: mockUser };
    }
  };

  // Logout: wipe state and storage, redirect to login.
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Quick permission helpers to avoid repetition in pages.
  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) return requiredRoles.includes(user.role);
    return user.role === requiredRoles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        register,
        logout,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
