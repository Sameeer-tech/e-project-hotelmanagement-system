import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

// Initial Realistic Mock Data
const INITIAL_STAFF = [
  { id: 'STF-101', name: 'Eleanor Vance', email: 'e.vance@luxurystay.com', role: 'Manager', status: 'Active' },
  { id: 'STF-102', name: 'Marcus Brody', email: 'm.brody@luxurystay.com', role: 'Receptionist', status: 'Active' },
  { id: 'STF-103', name: 'Sofia Rodriguez', email: 's.rodriguez@luxurystay.com', role: 'Housekeeping', status: 'Active' },
  { id: 'STF-104', name: 'David Chen', email: 'd.chen@luxurystay.com', role: 'Housekeeping', status: 'Inactive' },
];

const INITIAL_ROOMS = [
  { id: '101', number: '101', type: 'Standard', floor: '1st Floor', price: 180, status: 'Available' },
  { id: '102', number: '102', type: 'Standard', floor: '1st Floor', price: 180, status: 'Occupied' },
  { id: '201', number: '201', type: 'Deluxe', floor: '2nd Floor', price: 280, status: 'Needs Cleaning' },
  { id: '202', number: '202', type: 'Deluxe', floor: '2nd Floor', price: 280, status: 'Available' },
  { id: '301', number: '301', type: 'Executive Suite', floor: '3rd Floor', price: 450, status: 'Maintenance' },
  { id: '302', number: '302', type: 'Executive Suite', floor: '3rd Floor', price: 450, status: 'Occupied' },
];

const INITIAL_HOUSEKEEPING_TASKS = [
  { id: 'TSK-01', room: '201', assignedTo: 'Sofia Rodriguez', priority: 'High', status: 'Dirty' },
  { id: 'TSK-02', room: '104', assignedTo: 'Sofia Rodriguez', priority: 'Medium', status: 'In Progress' },
  { id: 'TSK-03', room: '305', assignedTo: 'David Chen', priority: 'Low', status: 'Inspected' },
];

const INITIAL_MAINTENANCE_LOGS = [
  { id: 'MNT-801', room: '301', category: 'HVAC', priority: 'Urgent', status: 'In Progress', description: 'Air conditioner leaking water.' },
  { id: 'MNT-802', room: '105', category: 'Plumbing', priority: 'Medium', status: 'Pending', description: 'Bathroom sink drains slowly.' },
];

const INITIAL_GUESTS = [
  {
    id: 'GST-001',
    name: 'Jonathan Pierce',
    email: 'j.pierce@email.com',
    phone: '+1 555 018 2209',
    passport: 'P-88293012',
    nationality: 'United Kingdom',
    preferences: ['King Bed', 'High Floor', 'Non-Smoking'],
    specialRequests: ['Hypoallergenic Pillows', 'Daily Newspaper'],
    stayHistory: [
      { dates: 'Jun 12–16, 2026', room: '202', total: '$1,120.00', rating: 5 },
      { dates: 'Apr 03–05, 2026', room: '102', total: '$540.00', rating: 4 },
    ],
    loyaltyTier: 'Platinum',
    points: 24850,
  },
];

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('Admin');
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [tasks, setTasks] = useState(INITIAL_HOUSEKEEPING_TASKS);
  const [maintenanceLogs, setMaintenanceLogs] = useState(INITIAL_MAINTENANCE_LOGS);
  const [guests, setGuests] = useState(INITIAL_GUESTS);
  const [toasts, setToasts] = useState([]);
  const [feedbackScores, setFeedbackScores] = useState([5, 4, 5, 5, 4, 3, 5, 4]);

  const [sysConfig, setSysConfig] = useState({
    taxRate: 12,
    basePriceOverride: 0,
    cancellationPolicy: 'Full refund up to 48 hours prior to check-in date.',
    emergencyAlert: false,
    emergencyMessage: 'Routine maintenance scheduled tonight at 02:00 AM UTC.',
  });

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State Mutation Handlers
  const addStaff = (newStaff) => {
    setStaffList((prev) => [...prev, { ...newStaff, id: `STF-${Date.now().toString().slice(-3)}` }]);
    addToast('New staff member added successfully.', 'success');
  };

  const updateRoomStatus = (roomNumber, newStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.number === roomNumber ? { ...r, status: newStatus } : r))
    );
    addToast(`Room ${roomNumber} status updated to ${newStatus}.`, 'info');
  };

  const addMaintenanceLog = (log) => {
    const newLog = { ...log, id: `MNT-${Date.now().toString().slice(-3)}`, status: 'Pending' };
    setMaintenanceLogs((prev) => [newLog, ...prev]);
    addToast(`Maintenance ticket ${newLog.id} logged successfully.`, 'warning');
  };

  const moveTaskStatus = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );
    addToast(`Task updated to ${nextStatus}.`, 'success');
  };

  const updateStaff = (staffId, updates) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, ...updates } : s))
    );
    addToast(`Staff record updated successfully.`, 'success');
  };

  const toggleStaffStatus = (staffId) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' }
          : s
      )
    );
    addToast(`Staff status toggled.`, 'warning');
  };

  const advanceMaintenanceStatus = (logId, nextStatus) => {
    setMaintenanceLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: nextStatus } : l))
    );
    addToast(`Maintenance ticket status set to ${nextStatus}.`, 'info');
  };

  const submitFeedback = (stars, comment) => {
    setFeedbackScores((prev) => [...prev, stars]);
    addToast(`Thank you! Rated ${stars}/5 stars.`, 'success');
  };

  const updateGuestProfile = (guestId, updates) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, ...updates } : g))
    );
    addToast(`Guest profile updated.`, 'success');
  };

  const getEffectiveRoomPrice = (room) => {
    const base = Number(room.price) || 0;
    return Math.max(0, base + Number(sysConfig.basePriceOverride || 0));
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        staffList,
        addStaff,
        updateStaff,
        toggleStaffStatus,
        rooms,
        updateRoomStatus,
        getEffectiveRoomPrice,
        tasks,
        moveTaskStatus,
        maintenanceLogs,
        addMaintenanceLog,
        advanceMaintenanceStatus,
        guests,
        updateGuestProfile,
        feedbackScores,
        submitFeedback,
        sysConfig,
        setSysConfig,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);