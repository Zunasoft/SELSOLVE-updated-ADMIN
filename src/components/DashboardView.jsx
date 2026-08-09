import React from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  CheckCircle2, 
  Database, 
  DollarSign, 
  TrendingUp, 
  PlusCircle, 
  RefreshCw, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  ArrowUpRight,
  Clock,
  Layers
} from 'lucide-react';

export default function DashboardView({ 
  stats, 
  tenants, 
  plans, 
  auditLogs, 
  loading, 
  onRefresh, 
  onOpenCreateModal, 
  onNavigate 
}) {
  const activeTenants = tenants.filter(t => t.status === 'active');
  const starterCount = tenants.filter(t => t.plan === 'starter').length;
  const proCount = tenants.filter(t => t.plan === 'pro').length;
  const enterpriseCount = tenants.filter(t => t.plan === 'enterprise').length;

  return (
    <div className="space-y-8">
     

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        {[
          { 
            title: 'Registered Retail Shops', 
            value: stats ? stats.totalShops : 0, 
            subtitle: `${activeTenants.length} active subscriptions`, 
            icon: Store, 
            color: 'bg-indigo-600 text-white' 
          },
          { 
            title: 'Active POS Terminals', 
            value: stats ? stats.activeShops : 0, 
            subtitle: 'Live active devices', 
            icon: CheckCircle2, 
            color: 'bg-emerald-600 text-white' 
          },
          { 
            title: 'Monthly SaaS MRR', 
            value: `₹${stats ? stats.mrr.toLocaleString('en-IN') : 0}`, 
            subtitle: 'Estimated Monthly Yield', 
            icon: DollarSign, 
            color: 'bg-purple-600 text-white' 
          }
        ].map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="panel-light p-6 rounded-3xl card-hover relative"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {m.title}
              </span>
              <div className={`p-2.5 rounded-xl ${m.color} shadow-sm`}>
                <m.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {m.value}
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {m.subtitle}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Subscription Tiers Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Distribution Card */}
        <div className="panel-light p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Subscription Tier Breakdown
            </h3>
            <button 
              onClick={() => onNavigate('plans')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Manage Plans <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { name: 'Starter Plan', count: starterCount, color: 'bg-cyan-500', price: '₹999/mo' },
              { name: 'Pro Retailer', count: proCount, color: 'bg-indigo-600', price: '₹2,499/mo' },
              { name: 'Enterprise Tier', count: enterpriseCount, color: 'bg-purple-600', price: '₹19,999/yr' }
            ].map((tier, idx) => {
              const pct = tenants.length ? Math.round((tier.count / tenants.length) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{tier.name} ({tier.price})</span>
                    <span className="text-slate-900 dark:text-white">{tier.count} shops ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full ${tier.color} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity & Audit Stream */}
        <div className="lg:col-span-2 panel-light p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Live Super Admin Audit Stream
            </h3>
            <button 
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View Full Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No activity logged yet.</div>
            ) : (
              auditLogs.slice(0, 5).map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase shrink-0 ${
                      log.status === 'SUCCESS' 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{log.description}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
