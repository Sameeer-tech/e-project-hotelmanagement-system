import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Wrench, Plus, CheckCircle2, ArrowRight, PlayCircle, CheckCircle } from 'lucide-react';

export const HousekeepingPortal = () => {
  const { tasks, moveTaskStatus, maintenanceLogs, addMaintenanceLog, advanceMaintenanceStatus, addToast } = useApp();

  // Maintenance Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ room: '', category: 'Plumbing', priority: 'Medium', description: '' });

  const handleReportSubmit = (e) => {
    e.preventDefault();
    addMaintenanceLog(reportForm);
    setReportForm({ room: '', category: 'Plumbing', priority: 'Medium', description: '' });
    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Kanban Board View */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Housekeeping Kanban Board</h2>
            <p className="text-xs text-slate-400">Track and advance room cleaning workflow.</p>
          </div>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Wrench className="w-4 h-4" /> Report Issue
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: 'Dirty / Needs Cleaning', key: 'Dirty' },
            { title: 'In Progress', key: 'In Progress' },
            { title: 'Inspected & Ready', key: 'Inspected' },
          ].map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{col.title}</h3>
                  <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div key={task.id} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold font-mono text-slate-100">Room {task.room}</span>
                        <Badge variant={task.priority}>{task.priority} Priority</Badge>
                      </div>
                      <p className="text-xs text-slate-400">Staff Assigned: {task.assignedTo}</p>

                      <div className="pt-2 border-t border-slate-700/50 flex justify-end">
                        {col.key === 'Dirty' && (
                          <button
                            onClick={() => moveTaskStatus(task.id, 'In Progress')}
                            className="flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:underline"
                          >
                            Start Cleaning <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.key === 'In Progress' && (
                          <button
                            onClick={() => moveTaskStatus(task.id, 'Inspected')}
                            className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline"
                          >
                            Mark as Ready <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.key === 'Inspected' && (
                          <span className="text-xs text-emerald-400 font-medium">Verified Clean</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance Issues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100">Active Maintenance Log</h2>
          <p className="text-xs text-slate-400">Engineering and repair tickets.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="bg-slate-800/50 uppercase text-slate-400">
              <tr>
                <th className="p-4">Ticket ID</th>
                <th className="p-4">Room #</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Advance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {maintenanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-mono text-slate-400">{log.id}</td>
                  <td className="p-4 font-bold text-slate-100">{log.room}</td>
                  <td className="p-4">{log.category}</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">{log.description}</td>
                  <td className="p-4"><Badge variant={log.priority}>{log.priority}</Badge></td>
                  <td className="p-4"><Badge variant={log.status}>{log.status}</Badge></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {log.status === 'Pending' && (
                        <button
                          onClick={() => advanceMaintenanceStatus(log.id, 'In Progress')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg font-semibold transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Start Work
                        </button>
                      )}
                      {log.status === 'In Progress' && (
                        <button
                          onClick={() => advanceMaintenanceStatus(log.id, 'Resolved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Fixed
                        </button>
                      )}
                      {(log.status === 'Resolved' || log.status === 'Fixed') && (
                        <span className="px-3 py-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Complete</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Reporting Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Report Maintenance Issue</h3>
            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 301"
                  value={reportForm.room}
                  onChange={(e) => setReportForm({ ...reportForm, room: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority Level</label>
                  <select
                    value={reportForm.priority}
                    onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Issue Description</label>
                <textarea
                  required
                  rows={3}
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  placeholder="Detail the technical defect..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg">Submit Issue Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};