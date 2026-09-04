import React from 'react';

export const Badge = ({ variant, children }) => {
  const styles = {
    Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Fixed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Occupied: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Needs Cleaning': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Dirty: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    High: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Maintenance: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Inspected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Platinum: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30',
    Gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Silver: 'bg-slate-400/10 text-slate-300 border-slate-400/30',
  };

  const defaultStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant] || defaultStyle}`}>
      {children || variant}
    </span>
  );
};