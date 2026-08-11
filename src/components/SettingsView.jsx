import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, 
  AlertTriangle, 
  Bell, 
  Clock, 
  Save, 
  CheckCircle2, 
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

import { ADMIN_BE } from '../config/config';

const formatUrl = (url) => {
  if (!url) return 'https://selsolve-updated-backend.vercel.app/api';
  const clean = url.replace(/\/$/, '');
  return clean.startsWith('http') ? clean : `https://${clean}`;
};

const ADMIN_API_URL = `${formatUrl(ADMIN_BE)}/admin`;

export default function SettingsView({ showNotification }) {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    systemNotification: '',
    otpExpiryMinutes: 10,
    allowRegistration: true
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/settings`);
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${ADMIN_API_URL}/settings`, settings);
      if (res.data.success) {
        showNotification('Platform settings updated successfully.');
      }
    } catch (err) {
      showNotification('Failed to update settings.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Global SaaS Platform Settings & Switches
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure platform-wide flags, OTP verification time window, maintenance mode, and system messages.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Maintenance Mode Toggle */}
        <div className="panel-light p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Maintenance Mode</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Temporarily lock POS backend sync for maintenance operations.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode} 
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* System Message Broadcast */}
        <div className="panel-light p-6 rounded-3xl space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>System Announcement Banner</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Broadcast message displayed at the top of all tenant admin dashboards.
          </p>
          <input 
            type="text"
            value={settings.systemNotification || ''}
            onChange={(e) => setSettings({ ...settings, systemNotification: e.target.value })}
            placeholder="Enter announcement text..."
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Security & OTP Window */}
        <div className="panel-light p-6 rounded-3xl space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>OTP Token Validity Duration</span>
          </div>

          <div className="max-w-xs space-y-1">
            <label className="block font-bold uppercase text-slate-600 dark:text-slate-400">Expiry Time (Minutes)</label>
            <input 
              type="number"
              min="1"
              max="60"
              value={settings.otpExpiryMinutes || 10}
              onChange={(e) => setSettings({ ...settings, otpExpiryMinutes: parseInt(e.target.value) || 10 })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
}
