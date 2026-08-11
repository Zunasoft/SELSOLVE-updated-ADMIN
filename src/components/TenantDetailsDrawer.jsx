import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  Database,
  Calendar,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Cpu,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Layers,
  User,
  CreditCard,
  Lock,
  Info,
  HardDrive
} from 'lucide-react';

import { ADMIN_API_URL } from '../authClient';

const Badge = ({ active, activeLabel = 'Active', inactiveLabel = 'Disabled' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
      active
        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
    {active ? activeLabel : inactiveLabel}
  </span>
);

const SectionCard = ({ icon: Icon, title, children, right }) => (
  <div className="panel-light p-5 rounded-2xl space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <Icon className="w-4 h-4 text-indigo-600" />
        {title}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-2 text-xs">
    <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`text-slate-800 dark:text-slate-200 font-semibold truncate ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  </div>
);

export default function TenantDetailsDrawer({ tenantId, onClose, onUpdateTenant, showNotification }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featureEdits, setFeatureEdits] = useState({});
  const [savingFeatures, setSavingFeatures] = useState(false);

  const isOpen = Boolean(tenantId);

  const fetchDetails = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/tenants/${tenantId}/details`);
      if (res.data.success) {
        setDetails(res.data.data);
        setFeatureEdits(res.data.data.tenant?.features || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchDetails();
    } else {
      setDetails(null);
      setFeatureEdits({});
      setError(null);
    }
  }, [tenantId, fetchDetails]);

  const toggleFeature = (key, core) => {
    if (core) return;
    setFeatureEdits((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveFeatures = async () => {
    if (!details) return;
    setSavingFeatures(true);
    try {
      await onUpdateTenant(details.tenant.id, { features: featureEdits });
      await fetchDetails();
    } catch {
      showNotification?.('Failed to update feature availability.', 'error');
    } finally {
      setSavingFeatures(false);
    }
  };

  const tenant = details?.tenant;
  const plan = details?.plan;
  const licence = details?.licence;
  const database = details?.database;
  const auditLogs = details?.auditLogs || [];
  const daysRemaining = details?.daysRemaining;
  const isExpired = details?.isExpired;

  const usagePct = licence && licence.maxDevices
    ? Math.min(100, Math.round((licence.activeDevices / licence.maxDevices) * 100))
    : 0;

  const expiryTone = isExpired
    ? 'text-rose-600 dark:text-rose-400'
    : daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 7
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const groupedFeatures = (details?.featureCatalog || []).reduce((acc, f) => {
    acc[f.group] = acc[f.group] || [];
    acc[f.group].push(f);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="relative w-full sm:max-w-xl h-full bg-slate-50 dark:bg-slate-950 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {tenant ? tenant.name : 'Shop Details'}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fetchDetails}
                  title="Refresh"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  title="Close"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {loading && !details && (
                <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-500 dark:text-slate-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading shop details…
                </div>
              )}

              {error && !loading && (
                <div className="panel-light p-5 rounded-2xl flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {tenant && (
                <>
                  {/* 1. Profile */}
                  <SectionCard
                    icon={User}
                    title="Shop Profile"
                    right={<Badge active={tenant.status === 'active'} />}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow icon={Mail} label="Owner Email" value={tenant.email} mono />
                      <InfoRow icon={Phone} label="Phone" value={tenant.phone} />
                      <InfoRow icon={Layers} label="Slug" value={tenant.slug} mono />
                      <InfoRow icon={Database} label="Isolated Database" value={tenant.dbName} mono />
                      <InfoRow
                        icon={Calendar}
                        label="Created On"
                        value={tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}
                      />
                      <InfoRow icon={Sparkles} label="Subscription Tier" value={tenant.plan} />
                    </div>
                  </SectionCard>

                  {/* 2. Subscription */}
                  <SectionCard icon={CreditCard} title="Subscription & Billing">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <InfoRow icon={Sparkles} label="Plan" value={plan ? plan.name : tenant.plan} />
                      <InfoRow
                        icon={CreditCard}
                        label="Price / Cycle"
                        value={plan ? `₹${Number(plan.price).toLocaleString('en-IN')} / ${plan.billingCycle}` : '—'}
                      />
                      <InfoRow icon={Calendar} label="Expiry Date" value={tenant.expiryDate || 'Unlimited'} />
                      <div className="flex items-start gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                            Days Remaining
                          </div>
                          <div className={`font-bold ${expiryTone}`}>
                            {isExpired
                              ? `Expired ${Math.abs(daysRemaining)} day(s) ago`
                              : daysRemaining === null || daysRemaining === undefined
                                ? 'Unlimited'
                                : `${daysRemaining} day(s) left`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 3. Licence & Devices */}
                  <SectionCard icon={Cpu} title="Licence & Devices">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">
                          {licence?.activeDevices || 0} / {licence?.maxDevices || 0} Active Terminals
                        </span>
                        <span className="text-slate-900 dark:text-white">{usagePct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${usagePct >= 90 ? 'bg-rose-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                          style={{ width: `${usagePct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                      {!licence?.devices?.length ? (
                        <div className="text-center py-4 text-[11px] text-slate-500 dark:text-slate-400">
                          No devices registered for this shop.
                        </div>
                      ) : (
                        licence.devices.map((d, idx) => (
                          <div
                            key={d.id || idx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{d.deviceName}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.model}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  d.status === 'active'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {d.status}
                              </span>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleDateString() : 'Never seen'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SectionCard>

                  {/* 4. Feature Availability */}
                  <SectionCard
                    icon={ShieldCheck}
                    title="Feature Availability"
                    right={
                      <button
                        onClick={handleSaveFeatures}
                        disabled={savingFeatures}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[11px] font-bold flex items-center gap-1.5"
                      >
                        {savingFeatures ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Overrides
                      </button>
                    }
                  >
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      Per-shop overrides win over the plan default. Changing this shop's <strong>plan</strong> (via Edit Shop) re-derives features from that plan's defaults and replaces these overrides.
                    </div>

                    <div className="space-y-4 pt-1">
                      {Object.entries(groupedFeatures).map(([group, feats]) => (
                        <div key={group} className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {group}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {feats.map((f) => {
                              const on = f.core ? true : Boolean(featureEdits[f.key]);
                              return (
                                <label
                                  key={f.key}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${
                                    f.core
                                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                      : on
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-pointer'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    disabled={f.core}
                                    onChange={() => toggleFeature(f.key, f.core)}
                                    className="w-3.5 h-3.5 accent-indigo-600"
                                  />
                                  <span className="truncate flex-1">{f.label}</span>
                                  {f.core && <Lock className="w-3 h-3 shrink-0" />}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {/* 5. Database */}
                  <SectionCard icon={HardDrive} title="Isolated Database">
                    {!database ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Database statistics are unavailable — MongoDB is offline or this shop's database has not been provisioned yet.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <InfoRow icon={Database} label="Database Name" value={database.dbName} mono />
                          <InfoRow icon={Layers} label="Collections" value={database.collections} />
                          <InfoRow icon={HardDrive} label="Disk Size" value={`${database.sizeMB} MB`} />
                        </div>
                        <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(database.counts || {}).map(([key, count]) => (
                            <div
                              key={key}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center"
                            >
                              <div className="text-base font-extrabold text-slate-900 dark:text-white">{count}</div>
                              <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 capitalize">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </SectionCard>

                  {/* 6. Recent Activity */}
                  <SectionCard icon={Activity} title="Recent Activity">
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {auditLogs.length === 0 ? (
                        <div className="text-center py-4 text-[11px] text-slate-500 dark:text-slate-400">
                          No recent audit activity for this shop.
                        </div>
                      ) : (
                        auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 rounded-md font-mono font-bold text-[9px] uppercase shrink-0 ${
                                  log.status === 'SUCCESS'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{log.description}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0">
                              <Clock className="w-3 h-3" />
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SectionCard>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
