import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard,
  AlertTriangle,
  DollarSign,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

import { ADMIN_BE } from '../config/config';

const formatUrl = (url) => {
  if (!url) return 'https://selsolve-updated-backend.vercel.app/api';
  const clean = url.replace(/\/$/, '');
  return clean.startsWith('http') ? clean : `https://${clean}`;
};

const ADMIN_API_URL = `${formatUrl(ADMIN_BE)}/admin`;

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const truncateId = (id) => (id && id.length > 18 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id || '—');

const emptyOrderForm = { tenantId: '', planId: '', amount: '', purpose: 'NEW_SUBSCRIPTION' };

export default function BillingView({ isDarkMode, showToast }) {
  const [config, setConfig] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [configRes, paymentsRes, subsRes, catalogRes] = await Promise.all([
        axios.get(`${ADMIN_API_URL}/payments/config`),
        axios.get(`${ADMIN_API_URL}/payments`),
        axios.get(`${ADMIN_API_URL}/subscriptions`),
        axios.get(`${ADMIN_API_URL}/plans/catalog`)
      ]);
      setConfig(configRes.data);
      setPayments(paymentsRes.data.payments || []);
      setSummary(paymentsRes.data.summary || null);
      setSubscriptions(subsRes.data.subscriptions || []);
      setPlans(catalogRes.data.plans || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load billing data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredPayments = payments.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    setOrderForm({ ...orderForm, planId, amount: plan ? plan.price : orderForm.amount });
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.tenantId || !orderForm.planId || !orderForm.amount) {
      showToast('Shop, plan, and amount are required.', 'error');
      return;
    }
    setCreatingOrder(true);
    try {
      const res = await axios.post(`${ADMIN_API_URL}/payments/order`, orderForm);
      setActiveOrder(res.data?.data || null);
      showToast('Payment order created.');
      fetchAll();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create payment order.', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleSimulate = async (outcome) => {
    if (!activeOrder) return;
    setSimulating(true);
    try {
      await axios.post(`${ADMIN_API_URL}/payments/${activeOrder.id}/simulate`, { outcome });
      showToast(`Payment simulated as ${outcome}.`);
      setActiveOrder(null);
      setOrderForm(emptyOrderForm);
      fetchAll();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to simulate payment.', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const statusBadge = (status, failureReason) => {
    if (status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" /> Success
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" /> Failed
          </span>
          {failureReason && <div className="text-[10px] text-rose-500 dark:text-rose-400 mt-1 max-w-[160px]">{failureReason}</div>}
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock className="w-3 h-3" /> Created
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            SaaS Billing & Payments
            {config && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${config.mode === 'LIVE'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                {config.mode} Mode
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create Razorpay payment orders, track collections, and reconcile every renewal transaction.
          </p>
        </div>
      </div>

      {/* Simulation Mode Notice */}
      {config && config.mode === 'SIMULATION' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Live Razorpay keys are not configured for this environment. All payment orders will be <strong>simulated</strong> —
            no real money moves, and outcomes must be forced manually using the Simulate Success / Failure buttons.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Collected (All Time)</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            {formatCurrency(summary?.collected)}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Collected This Month</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            {formatCurrency(summary?.thisMonth)}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Successful</span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {summary ? summary.count : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Failed</span>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {summary ? summary.failed : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Pending</span>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {summary ? summary.pending : 0}
          </div>
        </div>
      </div>

      {/* Collect Payment Panel */}
      <div className="panel-light p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          Collect Payment
        </h3>

        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Shop</label>
            <select
              value={orderForm.tenantId}
              onChange={(e) => setOrderForm({ ...orderForm, tenantId: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
              required
            >
              <option value="">Select shop…</option>
              {subscriptions.map((s) => (
                <option key={s.tenantId} value={s.tenantId}>{s.shopName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Plan</label>
            <select
              value={orderForm.planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
              required
            >
              <option value="">Select plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={orderForm.amount}
              onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Purpose</label>
            <select
              value={orderForm.purpose}
              onChange={(e) => setOrderForm({ ...orderForm, purpose: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
            >
              <option value="NEW_SUBSCRIPTION">New Subscription</option>
              <option value="RENEWAL">Renewal</option>
              <option value="UPGRADE">Upgrade</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={creatingOrder}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-60"
            >
              {creatingOrder ? 'Creating…' : 'Create Payment Order'}
            </button>
          </div>
        </form>

        {/* Result of the most recently created order */}
        {activeOrder && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span><strong className="text-slate-900 dark:text-white">Order ID:</strong> <span className="font-mono">{activeOrder.orderId}</span></span>
              <span><strong className="text-slate-900 dark:text-white">Receipt:</strong> <span className="font-mono">{activeOrder.receipt}</span></span>
            </div>

            {config?.mode === 'SIMULATION' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSimulate('SUCCESS')}
                  disabled={simulating}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-bold transition-all disabled:opacity-60"
                >
                  Simulate Success
                </button>
                <button
                  onClick={() => handleSimulate('FAILED')}
                  disabled={simulating}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-bold transition-all disabled:opacity-60"
                >
                  Simulate Failure
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Hand the returned <code className="font-mono">checkout</code> object to the Razorpay Checkout script on the
                  operator's device to complete this payment live.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="panel-light p-4 rounded-2xl flex items-center justify-between gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="SUCCESS">Success Only</option>
          <option value="FAILED">Failed Only</option>
          <option value="CREATED">Created Only</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Receipt</th>
                <th className="py-4 px-5">Shop</th>
                <th className="py-4 px-5">Plan</th>
                <th className="py-4 px-5">Purpose</th>
                <th className="py-4 px-5">Amount</th>
                <th className="py-4 px-5">Gateway Payment ID</th>
                <th className="py-4 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 dark:text-slate-400">Loading payments…</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 dark:text-slate-400">No payments match this filter.</td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{p.receipt}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{p.shopName}</td>
                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300">{p.planName}</td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400">{p.purpose}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{formatCurrency(p.amount)}</td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {truncateId(p.razorpayPaymentId)}
                    </td>
                    <td className="py-4 px-5">{statusBadge(p.status, p.failureReason)}</td>
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
