import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Search,
  Filter,
  PlusCircle,
  Database,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  Calendar,
  Smartphone,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  X
} from 'lucide-react';

import TenantDetailsDrawer from './TenantDetailsDrawer';

export default function TenantsView({
  tenants,
  onToggleStatus,
  onUpdateTenant,
  onOpenCreateModal,
  showNotification
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingTenantId, setViewingTenantId] = useState(null);

  // Form edit state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    plan: 'starter',
    maxDevices: 2,
    expiryDate: ''
  });

  const handleStartEdit = (t) => {
    setEditingTenant(t);
    setEditForm({
      name: t.name || '',
      phone: t.phone || '',
      plan: t.plan || 'starter',
      maxDevices: t.maxDevices || 2,
      expiryDate: t.expiryDate || ''
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    onUpdateTenant(editingTenant.id, editForm);
    setEditingTenant(null);
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.dbName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || t.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Registered Retail Shops & Tenant Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multi-tenant isolated MongoDB databases, terminals, and subscription plans.
          </p>
        </div>

        <button 
          onClick={onOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Provision New Shop
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="panel-light p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input 
            type="text"
            placeholder="Search shop, email, or DB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter Plan</option>
            <option value="pro">Pro Retailer</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Shop Business & Contact</th>
                <th className="py-4 px-5">Dynamic DB String</th>
                <th className="py-4 px-5">Subscription Plan</th>
                <th className="py-4 px-5">Max Terminals</th>
                <th className="py-4 px-5">Expiry Date</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No registered shops match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                      <div className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {t.email}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {t.phone}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                        <Database className="w-3.5 h-3.5" />
                        {t.dbName}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        t.plan === 'pro'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : t.plan === 'enterprise'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {t.plan}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {t.maxDevices} POS Devices
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {t.expiryDate || 'Unlimited'}
                    </td>

                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'active' 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {t.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => setViewingTenantId(t.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
                        title="View Shop Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleStartEdit(t)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
                        title="Edit Shop Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleStatus(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          t.status === 'active'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {t.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Shop Modal */}
      <AnimatePresence>
        {editingTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="panel-light p-6 max-w-md w-full rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  Edit Tenant Profile ({editingTenant.name})
                </h3>
                <button 
                  onClick={() => setEditingTenant(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Shop Name</label>
                  <input 
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Subscription Plan</label>
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro Retailer</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Max Devices</label>
                    <input 
                      type="number"
                      value={editForm.maxDevices}
                      onChange={(e) => setEditForm({ ...editForm, maxDevices: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Subscription Expiry Date</label>
                  <input 
                    type="date"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTenant(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Shop Details Slide-over Drawer */}
      <TenantDetailsDrawer
        tenantId={viewingTenantId}
        onClose={() => setViewingTenantId(null)}
        onUpdateTenant={onUpdateTenant}
        showNotification={showNotification}
      />
    </div>
  );
}
