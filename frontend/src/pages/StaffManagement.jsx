import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import api from '../utils/api';
import { Plus, Search, Pencil, Power, Loader2, X } from 'lucide-react';

// Staff Management page — admins and managers can add/edit/deactivate staff accounts.
// Uses AppContext for local state, and tries real API call with graceful fallback.
export const StaffManagement = () => {
  const { staffList, addStaff, updateStaff, toggleStaffStatus, addToast } = useApp();

  // UI / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'Receptionist',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // On mount, try to fetch real staff from backend. If it fails, we'll use mock data.
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        await api.get('/staff');
        // In a real app: setStaffList(res.data) — but mock data already exists in AppContext.
      } catch (e) {
        // Backend not ready yet — fall back to mock data (already in context).
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  const openAdd = () => {
    setEditingStaff(null);
    setStaffForm({ name: '', email: '', role: 'Receptionist', password: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      password: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!staffForm.name.trim()) errors.name = 'Full name is required';
    if (!staffForm.email.trim()) errors.email = 'Valid email is required';
    if (!editingStaff && (!staffForm.password || staffForm.password.length < 6)) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, staffForm).catch(() => {});
        updateStaff(editingStaff.id, {
          name: staffForm.name,
          email: staffForm.email,
          role: staffForm.role,
        });
      } else {
        await api
          .post('/staff', { ...staffForm, status: 'Active' })
          .catch(() => {});
        addStaff({
          name: staffForm.name,
          email: staffForm.email,
          role: staffForm.role,
          status: 'Active',
        });
      }
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/staff/${id}/status`).catch(() => {});
      toggleStaffStatus(id);
    } catch (e) {
      addToast('Could not reach the server. Toggled locally.', 'warning');
      toggleStaffStatus(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Staff Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage LuxuryStay employee accounts, roles, and access.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total Staff</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{staffList.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {staffList.filter((s) => s.status === 'Active').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Inactive</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {staffList.filter((s) => s.status === 'Inactive').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400">Roles</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {new Set(staffList.map((s) => s.role)).size}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-100">Staff Directory</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none w-28 sm:w-36"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Housekeeping">Housekeeping</option>
            </select>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="ml-3 text-sm text-slate-400">Loading staff...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="p-4">Staff ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-slate-400">{s.id}</td>
                      <td className="p-4 font-semibold text-slate-100">{s.name}</td>
                      <td className="p-4 text-slate-400">{s.email}</td>
                      <td className="p-4">{s.role}</td>
                      <td className="p-4">
                        <Badge variant={s.status}>{s.status}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 bg-slate-800 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(s.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              s.status === 'Active'
                                ? 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={s.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center text-slate-500"
                    >
                      No staff match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                {formErrors.name && (
                  <p className="text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, email: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                {formErrors.email && (
                  <p className="text-rose-400 mt-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, role: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option>Manager</option>
                  <option>Receptionist</option>
                  <option>Housekeeping</option>
                </select>
              </div>
              {!editingStaff && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, password: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {formErrors.password && (
                    <p className="text-rose-400 mt-1">{formErrors.password}</p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors"
                >
                  {loading
                    ? 'Saving...'
                    : editingStaff
                    ? 'Save Changes'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
