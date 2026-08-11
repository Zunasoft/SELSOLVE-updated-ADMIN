import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Cpu, 
  Activity, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  Zap
} from 'lucide-react';

import { ADMIN_BE } from '../config/config';

const formatUrl = (url) => {
  if (!url) return 'https://selsolve-updated-backend.vercel.app/api';
  const clean = url.replace(/\/$/, '');
  return clean.startsWith('http') ? clean : `https://${clean}`;
};

const ADMIN_API_URL = `${formatUrl(ADMIN_BE)}/admin`;

export default function DatabaseView() {
  const [dbHealth, setDbHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/database/health`);
      setDbHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch DB health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Dynamic Multi-Tenant Database Pool Monitor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time storage allocation, active connections, and latency metrics across isolated tenant databases.
          </p>
        </div>

        <button 
          onClick={fetchHealth}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Ping DB Diagnostics
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Master DB Host</span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            pos_master_db
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">● Primary Master Router</span>
        </div>

        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Total Storage Pool</span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-600" />
            {dbHealth ? `${dbHealth.totalStorageMB} MB` : '0 MB'}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Dynamic Disk Allocation</span>
        </div>

        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Active Isolated Pools</span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            {dbHealth ? dbHealth.totalIsolatedPools : 0} Tenant DBs
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">Strict Schema Isolation</span>
        </div>

        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Query Latency Benchmark</span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            3.2 ms avg
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">● Ultra Low Latency</span>
        </div>
      </div>

      {/* Database Pools Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Active Isolated Tenant Schemas
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Shop Business Name</th>
                <th className="py-4 px-5">Target Tenant DB String</th>
                <th className="py-4 px-5">Collections</th>
                <th className="py-4 px-5">Est. Disk Size</th>
                <th className="py-4 px-5">Active Connections</th>
                <th className="py-4 px-5">Pool Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {!dbHealth || !dbHealth.pools ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500 dark:text-slate-400">Loading database health...</td>
                </tr>
              ) : (
                dbHealth.pools.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </td>

                    <td className="py-4 px-5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {p.dbName}
                    </td>

                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                      {p.collectionsCount} collections
                    </td>

                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-bold">
                      {p.estimatedSizeMB} MB
                    </td>

                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300">
                      {p.activeConnections} active socket connection(s)
                    </td>

                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.status === 'HEALTHY'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {p.status}
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
