import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Terminal,
  Filter
} from 'lucide-react';

export default function AuditLogsView({ auditLogs }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Platform Audit Logs & Security History
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Chronological security audit trail recording super admin actions, shop provisioning, OTP authentications, and plan edits.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="panel-light p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input 
            type="text"
            placeholder="Search action, actor, or log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
        >
          <option value="all">All Action Types</option>
          <option value="TENANT_PROVISIONED">Tenant Provisioned</option>
          <option value="TENANT_STATUS_CHANGE">Status Change</option>
          <option value="TENANT_EDIT">Tenant Profile Edit</option>
          <option value="PLAN_UPDATE">Plan Pricing Update</option>
          <option value="OTP_SENT">OTP Dispatched</option>
          <option value="OTP_LOGIN_SUCCESS">OTP Auth Verified</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Action Identifier</th>
                <th className="py-4 px-5">Actor / User</th>
                <th className="py-4 px-5">Description & Details</th>
                <th className="py-4 px-5">IP Address</th>
                <th className="py-4 px-5">Outcome Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No security audit logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {log.actor}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300 max-w-md truncate">
                      {log.description}
                    </td>

                    <td className="py-4 px-5 font-mono text-slate-500 text-[11px]">
                      {log.ip || '127.0.0.1'}
                    </td>

                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
