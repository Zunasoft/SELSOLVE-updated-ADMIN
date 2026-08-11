import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Sparkles,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gift,
  Smartphone,
  X,
  History
} from 'lucide-react';

import { ADMIN_BE } from '../config/config';

const formatUrl = (url) => {
  if (!url) return 'https://selsolve-updated-backend.vercel.app/api';
  const clean = url.replace(/\/$/, '');
  return clean.startsWith('http') ? clean : `https://${clean}`;
};

const ADMIN_API_URL = `${formatUrl(ADMIN_BE)}/admin`;

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// EXPIRED/EXPIRING_SOON need operator attention first — everything else can wait.
const STATUS_PRIORITY = { EXPIRED: 0, EXPIRING_SOON: 1, ACTIVE: 2, SUSPENDED: 3 };

const addMonthsToDate = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const cycleToMonths = (cycle) => (cycle === 'Monthly' ? 1 : cycle === 'Quarterly' ? 3 : 12);

export default function SubscriptionsView({ isDarkMode, showToast }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [renewTarget, setRenewTarget] = useState(null);
  const [renewForm, setRenewForm] = useState({ planId: '', cycle: 'Monthly', months: '', notes: '' });
  const [renewSaving, setRenewSaving] = useState(false);

  const [trialTarget, setTrialTarget] = useState(null);
  const [trialDays, setTrialDays] = useState(14);
  const [trialSaving, setTrialSaving] = useState(false);

  const [collectingId, setCollectingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, catalogRes] = await Promise.all([
        axios.get(`${ADMIN_API_URL}/subscriptions`),
        axios.get(`${ADMIN_API_URL}/plans/catalog`)
      ]);
      setSubscriptions(subsRes.data.subscriptions || []);
      setSummary(subsRes.data.summary || null);
      setHistory(subsRes.data.history || []);
      setPlans(catalogRes.data.plans || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load subscriptions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9)
  );

  const openRenew = (sub) => {
    setRenewTarget(sub);
    setRenewForm({ planId: sub.plan || '', cycle: sub.billingCycle || 'Monthly', months: '', notes: '' });
  };

  const projectedExpiry = () => {
    if (!renewTarget) return null;
    const months = parseInt(renewForm.months, 10) || cycleToMonths(renewForm.cycle);
    // Renewing early must extend the existing paid period, not discard it.
    const base = new Date(Math.max(new Date(renewTarget.expiryDate).getTime(), Date.now()));
    return addMonthsToDate(base, months);
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    if (!renewTarget) return;
    setRenewSaving(true);
    try {
      await axios.post(`${ADMIN_API_URL}/subscriptions/${renewTarget.tenantId}/renew`, {
        planId: renewForm.planId,
        cycle: renewForm.cycle,
        months: renewForm.months ? parseInt(renewForm.months, 10) : undefined,
        notes: renewForm.notes
      });
      showToast(`${renewTarget.shopName} renewed successfully.`);
      setRenewTarget(null);
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to renew subscription.', 'error');
    } finally {
      setRenewSaving(false);
    }
  };

  const handleGrantTrial = async (e) => {
    e.preventDefault();
    if (!trialTarget) return;
    setTrialSaving(true);
    try {
      await axios.post(`${ADMIN_API_URL}/subscriptions/${trialTarget.tenantId}/trial`, { days: trialDays });
      showToast(`Trial granted to ${trialTarget.shopName}.`);
      setTrialTarget(null);
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to grant trial.', 'error');
    } finally {
      setTrialSaving(false);
    }
  };

  const handleCollectPayment = async (sub) => {
    setCollectingId(sub.tenantId);
    try {
      const res = await axios.post(`${ADMIN_API_URL}/payments/order`, {
        tenantId: sub.tenantId,
        planId: sub.plan,
        purpose: 'RENEWAL',
        amount: sub.price
      });
      const order = res.data?.data;
      showToast(`Payment order ${order?.receipt || order?.orderId || ''} created for ${sub.shopName}.`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create payment order.', 'error');
    } finally {
      setCollectingId(null);
    }
  };

  const daysRemainingBadge = (sub) => {
    const days = sub.daysRemaining;
    if (days < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Expired {Math.abs(days)}d ago
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {days}d left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        {days}d left
      </span>
    );
  };

  const statusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      EXPIRING_SOON: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      EXPIRED: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      SUSPENDED: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[status] || styles.SUSPENDED}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Subscriptions & Renewals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track expiries, grant trials, and collect renewal payments across every subscribed shop.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">MRR</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            {formatCurrency(summary?.mrr)}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Active</span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {summary ? summary.active : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Expiring Soon</span>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {summary ? summary.expiringSoon : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Expired</span>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {summary ? summary.expired : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Trials</span>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {summary ? summary.trials : 0}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Shop</th>
                <th className="py-4 px-5">Plan</th>
                <th className="py-4 px-5">Price</th>
                <th className="py-4 px-5">Devices</th>
                <th className="py-4 px-5">Expiry</th>
                <th className="py-4 px-5">Days Remaining</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Lifetime Value</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500 dark:text-slate-400">Loading subscriptions…</td>
                </tr>
              ) : sortedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500 dark:text-slate-400">No subscriptions found.</td>
                </tr>
              ) : (
                sortedSubscriptions.map((s) => (
                  <tr key={s.tenantId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{s.shopName}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{s.email}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        <Sparkles className="w-3 h-3" />
                        {s.planName}
                        {s.isTrial && <span className="ml-1 text-[9px] normal-case">(trial)</span>}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.price)}
                      <span className="text-slate-500 dark:text-slate-400 font-medium"> /{(s.billingCycle || '').toLowerCase()}</span>
                    </td>
                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {s.devicesUsed} / {s.maxDevices}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-5">{daysRemainingBadge(s)}</td>
                    <td className="py-4 px-5">{statusBadge(s.status)}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{formatCurrency(s.lifetimeValue)}</td>
                    <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openRenew(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-bold text-xs transition-all"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => { setTrialTarget(s); setTrialDays(14); }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-all"
                      >
                        Trial
                      </button>
                      <button
                        onClick={() => handleCollectPayment(s)}
                        disabled={collectingId === s.tenantId}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-all disabled:opacity-60"
                      >
                        {collectingId === s.tenantId ? '…' : 'Collect'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal History */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          Renewal History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Shop</th>
                <th className="py-4 px-5">Action</th>
                <th className="py-4 px-5">Plan</th>
                <th className="py-4 px-5">Amount</th>
                <th className="py-4 px-5">Previous → New Expiry</th>
                <th className="py-4 px-5">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 dark:text-slate-400">No renewal history yet.</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{h.shopName}</td>
                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300">{h.action}</td>
                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300">{h.planName}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{formatCurrency(h.amount)}</td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {h.previousExpiry ? new Date(h.previousExpiry).toLocaleDateString() : '—'} → {h.newExpiry ? new Date(h.newExpiry).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400">{h.performedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      {renewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel-light p-6 max-w-lg w-full rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="text-indigo-600 w-5 h-5" />
                Renew: {renewTarget.shopName}
              </h3>
              <button
                onClick={() => setRenewTarget(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs">
              Current plan <strong>{renewTarget.planName}</strong>, expiring{' '}
              <strong>{new Date(renewTarget.expiryDate).toLocaleDateString()}</strong>.
            </div>

            <form onSubmit={handleRenew} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Plan</label>
                <select
                  value={renewForm.planId}
                  onChange={(e) => setRenewForm({ ...renewForm, planId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                  required
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}/{p.billingCycle.toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Billing Cycle</label>
                  <select
                    value={renewForm.cycle}
                    onChange={(e) => setRenewForm({ ...renewForm, cycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Months Override</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Auto"
                    value={renewForm.months}
                    onChange={(e) => setRenewForm({ ...renewForm, months: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                <textarea
                  value={renewForm.notes}
                  onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                Projected new expiry: {projectedExpiry() ? projectedExpiry().toLocaleDateString() : '—'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 disabled:opacity-60"
                >
                  {renewSaving ? 'Renewing…' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Trial Modal */}
      {trialTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel-light p-6 max-w-sm w-full rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="text-indigo-600 w-5 h-5" />
                Grant Trial: {trialTarget.shopName}
              </h3>
              <button
                onClick={() => setTrialTarget(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantTrial} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Trial Days</label>
                <input
                  type="number"
                  min="1"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                Trial ends: {new Date(Date.now() + trialDays * 86400000).toLocaleDateString()}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrialTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trialSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 disabled:opacity-60"
                >
                  {trialSaving ? 'Granting…' : 'Grant Trial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
