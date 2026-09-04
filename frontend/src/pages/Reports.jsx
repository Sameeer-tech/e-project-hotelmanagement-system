import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Percent, DollarSign, Loader2 } from 'lucide-react';

// Reports page — occupancy rate and revenue charts using Recharts.
// Also shows a room-type distribution pie and some summary KPI cards.
export const Reports = () => {
  const { rooms, getEffectiveRoomPrice, sysConfig } = useApp();
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('Weekly'); // Weekly | Monthly | Yearly

  // Fetch real data when backend exists (falls back to mock).
  const [occupancyData, setOccupancyData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [occ, rev] = await Promise.all([
          api.get('/reports/occupancy').catch(() => null),
          api.get('/reports/revenue').catch(() => null),
        ]);
        if (occ?.data) setOccupancyData(occ.data);
        else setOccupancyData(buildMockOccupancy(range));
        if (rev?.data) setRevenueData(rev.data);
        else setRevenueData(buildMockRevenue(range));
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [range]);

  // ---- Mock data generators ----
  function buildMockOccupancy(r) {
    const weekly = [
      { day: 'Mon', rate: 72, rooms: 43 },
      { day: 'Tue', rate: 78, rooms: 47 },
      { day: 'Wed', rate: 82, rooms: 49 },
      { day: 'Thu', rate: 88, rooms: 53 },
      { day: 'Fri', rate: 95, rooms: 57 },
      { day: 'Sat', rate: 98, rooms: 59 },
      { day: 'Sun', rate: 84, rooms: 50 },
    ];
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      day: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      rate: 65 + Math.round(Math.sin(i / 2) * 25 + 10),
      rooms: 39 + Math.round(Math.sin(i / 2) * 15 + 6),
    }));
    return r === 'Monthly' ? monthly : weekly;
  }

  function buildMockRevenue(r) {
    const weekly = [
      { day: 'Mon', revenue: 14200, extras: 2100 },
      { day: 'Tue', revenue: 16800, extras: 2400 },
      { day: 'Wed', revenue: 18100, extras: 2900 },
      { day: 'Thu', revenue: 20500, extras: 3200 },
      { day: 'Fri', revenue: 24850, extras: 4100 },
      { day: 'Sat', revenue: 27300, extras: 4600 },
      { day: 'Sun', revenue: 19600, extras: 3100 },
    ];
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      day: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      revenue: 420000 + Math.round(Math.sin(i / 2) * 150000 + 50000),
      extras: 65000 + Math.round(Math.cos(i / 3) * 25000),
    }));
    return r === 'Monthly' ? monthly : weekly;
  }

  // Room type distribution (pie chart)
  const roomTypeData = React.useMemo(() => {
    const map = {};
    rooms.forEach((r) => (map[r.type] = (map[r.type] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [rooms]);

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // KPI summaries
  const kpis = React.useMemo(() => {
    const totalRooms = rooms.length || 1;
    const occupied = rooms.filter((r) => r.status === 'Occupied').length;
    const occ = Math.round((occupied / totalRooms) * 100);
    const totalRoomRev = rooms
      .filter((r) => r.status === 'Occupied')
      .reduce((s, r) => s + getEffectiveRoomPrice(r), 0);
    const estMonthlyRev = totalRoomRev * 30;
    const avgDailyRate = occupied ? Math.round(totalRoomRev / occupied) : 0;
    return {
      occupancy: `${occ}%`,
      monthlyRev: `$${(estMonthlyRev + sysConfig.basePriceOverride * 30).toLocaleString()}`,
      adr: `$${avgDailyRate.toLocaleString()}`,
      roomsSold: rooms.filter((r) => r.status !== 'Maintenance').length,
    };
  }, [rooms, getEffectiveRoomPrice, sysConfig]);

  const StatCard = ({ title, value, subtitle, icon: Icon, tone }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            tone === 'emerald'
              ? 'bg-emerald-500/15 text-emerald-400'
              : tone === 'amber'
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-indigo-500/15 text-indigo-400'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Occupancy, revenue, and inventory performance analytics.
          </p>
        </div>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {['Weekly', 'Monthly', 'Yearly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setRange(tf)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                range === tf
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Occupancy Rate" value={kpis.occupancy} subtitle="Today's snapshot" icon={Percent} tone="emerald" />
        <StatCard title="Est. Monthly Revenue" value={kpis.monthlyRev} subtitle="Based on current occupancy" icon={DollarSign} tone="indigo" />
        <StatCard title="Average Daily Rate" value={kpis.adr} subtitle="Per occupied room" icon={TrendingUp} tone="amber" />
        <StatCard title="Operational Rooms" value={kpis.roomsSold} subtitle={`of ${rooms.length} total`} icon={BarChart3} tone="indigo" />
      </div>

      {loading ? (
        <div className="p-20 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="ml-3 text-sm text-slate-400">Loading report data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Occupancy bar chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100">Occupancy Rate</h2>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                {range}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={occupancyData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#cbd5e1' }}
                  itemStyle={{ color: '#a5b4fc' }}
                />
                <Bar dataKey="rate" name="Occupancy %" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue line chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100">Revenue</h2>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                {range}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, '']}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" name="Room Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="extras" name="Extra Services" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Room type pie */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-base font-bold text-slate-100 mb-4">
              Room Type Distribution
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {roomTypeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue summary table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden">
            <h2 className="text-base font-bold text-slate-100 mb-4">
              {range} Breakdown
            </h2>
            <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/50 uppercase text-slate-400 tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Room Revenue</th>
                    <th className="p-3">Extras</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Occ %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {revenueData.map((row, i) => {
                    const total = row.revenue + row.extras;
                    const occ = occupancyData[i]?.rate || 0;
                    return (
                      <tr key={row.day} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-100">{row.day}</td>
                        <td className="p-3">${row.revenue.toLocaleString()}</td>
                        <td className="p-3 text-amber-400">${row.extras.toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-400">
                          ${total.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${occ}%` }}
                              />
                            </div>
                            <span>{occ}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
