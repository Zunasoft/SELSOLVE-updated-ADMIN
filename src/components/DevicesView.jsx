import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Smartphone,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Trash2,
  Copy,
  Wifi,
  Clock,
  Cpu,
  X,
  KeyRound
} from 'lucide-react';

import { ADMIN_BE } from '../config/config';

const formatUrl = (url) => {
  if (!url) return 'https://selsolve-updated-backend.vercel.app/api';
  const clean = url.replace(/\/$/, '');
  return clean.startsWith('http') ? clean : `https://${clean}`;
};

const ADMIN_API_URL = `${formatUrl(ADMIN_BE)}/admin`;

const emptyRegisterForm = {
  tenantId: '',
  deviceName: '',
  deviceId: '',
  model: '',
  androidVersion: '',
  appVersion: ''
};

export default function DevicesView({ isDarkMode, showToast }) {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [licences, setLicences] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterTenant, setFilterTenant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [saving, setSaving] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/devices`);
      setDevices(res.data.devices || []);
      setSummary(res.data.summary || null);
      setLicences(res.data.licences || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load registered devices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter((d) => {
    const matchesTenant = filterTenant === 'all' || d.tenantId === filterTenant;
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesTenant && matchesStatus;
  });

  const handleToggleStatus = async (device) => {
    const nextStatus = device.status === 'active' ? 'blocked' : 'active';
    try {
      await axios.patch(`${ADMIN_API_URL}/devices/${device.id}/status`, { status: nextStatus });
      showToast(`${device.deviceName} is now ${nextStatus}.`);
      fetchDevices();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update device status.', 'error');
    }
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`Permanently remove "${device.deviceName}"? This frees its licence seat.`)) return;
    try {
      await axios.delete(`${ADMIN_API_URL}/devices/${device.id}`);
      showToast(`${device.deviceName} was removed.`);
      fetchDevices();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete device.', 'error');
    }
  };

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      showToast('Licence key copied to clipboard.');
    } catch {
      showToast('Clipboard access was denied by the browser.', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.tenantId || !registerForm.deviceName) {
      showToast('Shop and Device name are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${ADMIN_API_URL}/devices`, registerForm);
      showToast('Device registered successfully.');
      setShowRegisterModal(false);
      setRegisterForm(emptyRegisterForm);
      fetchDevices();
    } catch (err) {
      // Seat-limit rejections carry a specific, operator-facing message — surface it as-is.
      showToast(err?.response?.data?.message || 'Failed to register device.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const truncateKey = (key) => (key && key.length > 14 ? `${key.slice(0, 10)}…${key.slice(-4)}` : key || '—');

  const seatBarColor = (used, seats) => {
    if (!seats) return 'bg-indigo-600';
    const pct = (used / seats) * 100;
    if (pct >= 100) return 'bg-rose-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Device & Licence Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Every registered POS terminal consumes one licence seat under per-device subscription plans.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Register Device
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Total Devices</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            {summary ? summary.total : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Active</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {summary ? summary.active : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Blocked</span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Ban className="w-4 h-4" />
            {summary ? summary.blocked : 0}
          </div>
        </div>
        <div className="panel-light p-5 rounded-3xl space-y-1">
          <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Online Today</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-600" />
            {summary ? summary.online : 0}
          </div>
        </div>
      </div>

      {/* Licence Utilisation */}
      <div className="panel-light p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Licence Utilisation
        </h3>

        <div className="space-y-4">
          {licences.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">No shop licences provisioned yet.</div>
          ) : (
            licences.map((l) => {
              const unlimited = l.model === 'PER_ORGANISATION';
              const pct = !unlimited && l.seats ? Math.min(100, Math.round((l.used / l.seats) * 100)) : 0;
              return (
                <div key={l.tenantId} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{l.shopName} <span className="text-slate-500 dark:text-slate-400 font-medium">({l.plan})</span></span>
                    <span className="text-slate-900 dark:text-white">
                      {unlimited ? 'Unlimited' : `${l.used} / ${l.seats} seats`}
                    </span>
                  </div>
                  {unlimited ? (
                    <div className="w-full h-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">
                      Unlimited Seats
                    </div>
                  ) : (
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${seatBarColor(l.used, l.seats)} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="panel-light p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
          >
            <option value="all">All Shops</option>
            {licences.map((l) => (
              <option key={l.tenantId} value={l.tenantId}>{l.shopName}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="panel-light rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Device</th>
                <th className="py-4 px-5">Shop</th>
                <th className="py-4 px-5">Device ID</th>
                <th className="py-4 px-5">Licence Key</th>
                <th className="py-4 px-5">Licence Model</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Last Seen</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 dark:text-slate-400">Loading devices…</td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 dark:text-slate-400">No devices match your filter criteria.</td>
                </tr>
              ) : (
                filteredDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{d.deviceName}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {d.model || 'Unknown model'} · Android {d.androidVersion || '—'}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-bold">{d.shopName}</td>

                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">{d.deviceId}</td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          {truncateKey(d.licenseKey)}
                        </span>
                        <button
                          onClick={() => handleCopy(d.licenseKey)}
                          title="Copy licence key"
                          className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {d.licenseModel === 'PER_ORGANISATION' ? 'Per-Org' : 'Per-Device'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        d.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {d.status === 'active' ? 'Active' : 'Blocked'}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Never'}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          d.status === 'active'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {d.status === 'active' ? 'Block' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-bold text-xs transition-all"
                        title="Delete Device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Device Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="panel-light p-6 max-w-lg w-full rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="text-indigo-600 w-5 h-5" />
                Register Device
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Shop *</label>
                <select
                  value={registerForm.tenantId}
                  onChange={(e) => setRegisterForm({ ...registerForm, tenantId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                  required
                >
                  <option value="">Select a shop…</option>
                  {licences.map((l) => (
                    <option key={l.tenantId} value={l.tenantId}>{l.shopName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Device Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Front Counter Terminal"
                  value={registerForm.deviceName}
                  onChange={(e) => setRegisterForm({ ...registerForm, deviceName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Device ID (optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={registerForm.deviceId}
                  onChange={(e) => setRegisterForm({ ...registerForm, deviceId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="Pixel 7a"
                    value={registerForm.model}
                    onChange={(e) => setRegisterForm({ ...registerForm, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Android Ver.</label>
                  <input
                    type="text"
                    placeholder="14"
                    value={registerForm.androidVersion}
                    onChange={(e) => setRegisterForm({ ...registerForm, androidVersion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">App Ver.</label>
                  <input
                    type="text"
                    placeholder="1.4.0"
                    value={registerForm.appVersion}
                    onChange={(e) => setRegisterForm({ ...registerForm, appVersion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Registering…' : 'Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
