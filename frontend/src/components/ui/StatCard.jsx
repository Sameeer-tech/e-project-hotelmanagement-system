import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm flex items-start justify-between">
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-slate-100 mt-1">{value}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      {trend && (
        <span className={`inline-block mt-2 text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
    <div className="p-3 bg-slate-800/80 rounded-lg text-indigo-400">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);