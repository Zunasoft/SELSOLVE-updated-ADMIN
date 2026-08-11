import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  Edit3,
  ShieldCheck,
  Smartphone,
  DollarSign,
  Layers,
  Users,
  Tag,
  X
} from 'lucide-react';

import { ADMIN_API_URL } from '../authClient';

export default function PlansView({ plans, onUpdatePlan }) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    price: 0,
    maxDevices: 2,
    features: []
  });
  const [featureCatalog, setFeatureCatalog] = useState([]);
  const [subscriberCounts, setSubscriberCounts] = useState({});

  // Canonical feature catalogue for the plan-wise availability grid.
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${ADMIN_API_URL}/features`);
        if (res.data.success) setFeatureCatalog(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch feature catalogue:', err);
      }
    })();
  }, []);

  // Best-effort enrichment: subscriber counts per plan (falls back to nothing shown).
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${ADMIN_API_URL}/plans/catalog`);
        if (res.data.success) {
          const counts = {};
          (res.data.data.plans || []).forEach((p) => {
            counts[p.id] = p.subscriberCount;
          });
          setSubscriberCounts(counts);
        }
      } catch (err) {
        // Non-critical enrichment — plan cards still work without it.
      }
    })();
  }, [plans]);

  const groupedFeatures = useMemo(
    () =>
      featureCatalog.reduce((acc, f) => {
        acc[f.group] = acc[f.group] || [];
        acc[f.group].push(f);
        return acc;
      }, {}),
    [featureCatalog]
  );

  const handleStartEdit = (p) => {
    setEditingPlan(p);
    setPlanForm({
      price: p.price,
      maxDevices: p.maxDevices,
      features: Array.isArray(p.features) ? [...p.features] : []
    });
  };

  const toggleFeature = (key, core) => {
    if (core) return;
    setPlanForm((prev) => {
      const has = prev.features.includes(key);
      return {
        ...prev,
        features: has ? prev.features.filter((k) => k !== key) : [...prev.features, key]
      };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    // Core features always ship with every plan regardless of what's checked.
    const coreKeys = featureCatalog.filter((f) => f.core).map((f) => f.key);
    const features = Array.from(new Set([...planForm.features, ...coreKeys]));
    onUpdatePlan(editingPlan.id, {
      price: planForm.price,
      maxDevices: planForm.maxDevices,
      features
    });
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          SaaS Subscription Plans & Tier Management
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure subscription tier pricing, max active terminals limit, and entitlement feature flags.
        </p>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`panel-light p-6 rounded-3xl space-y-5 relative card-hover flex flex-col justify-between ${
              p.id === 'pro' ? 'border-2 border-indigo-500 ring-2 ring-indigo-500/10' : ''
            }`}
          >
            {p.id === 'pro' && (
              <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{p.name}</h3>
                <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 font-mono">{p.billingCycle}</span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{p.price.toLocaleString('en-IN')}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">/{p.billingCycle.toLowerCase()}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
                {p.licenseModel && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Tag className="w-3 h-3" />
                    {p.licenseModel.replace('_', ' ')}
                  </span>
                )}
                {subscriberCounts[p.id] !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    <Users className="w-3 h-3" />
                    {subscriberCounts[p.id]} Subscriber{subscriberCounts[p.id] === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Up to {p.maxDevices} POS Devices</span>
                </div>

                <div className="pt-2 font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-slate-400">
                  Included Features:
                </div>

                {Array.isArray(p.features) && p.features.slice(0, 6).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="capitalize">{feat.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                ))}
                {Array.isArray(p.features) && p.features.length > 6 && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    +{p.features.length - 6} more feature(s)
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleStartEdit(p)}
              className="w-full mt-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Pricing, Limits & Features
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="panel-light p-6 max-w-xl w-full rounded-3xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 sticky -top-6 -mt-6 pt-6 bg-inherit">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  Edit Tier: {editingPlan.name}
                </h3>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Subscription Price (₹)</label>
                    <input
                      type="number"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Max Devices / Terminals</label>
                    <input
                      type="number"
                      value={planForm.maxDevices}
                      onChange={(e) => setPlanForm({ ...planForm, maxDevices: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {editingPlan.licenseModel && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    Licence Model: <span className="font-bold text-slate-900 dark:text-white">{editingPlan.licenseModel.replace('_', ' ')}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-600 dark:text-slate-400">Feature Availability</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Core features ship on every plan and cannot be unchecked. Shops on this tier get exactly what's checked here
                    unless a Super Admin grants a per-shop override.
                  </p>
                </div>

                <div className="space-y-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  {featureCatalog.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">Loading feature catalogue…</div>
                  ) : (
                    Object.entries(groupedFeatures).map(([group, feats]) => (
                      <div key={group} className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {group}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {feats.map((f) => {
                            const on = f.core ? true : planForm.features.includes(f.key);
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
                                <span className="truncate">{f.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700"
                  >
                    Save Plan Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
